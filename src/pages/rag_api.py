#!/usr/bin/env python3
"""
RAG API - SympAI
This script extracts the core RAG functionality from the Jupyter notebook
and makes it available as a command-line utility for the Node.js server.
"""

import sys
import os
import pickle
import json
try:
    import faiss
    from groq import Groq
    from sentence_transformers import SentenceTransformer
    import numpy as np
    import pandas as pd
    IMPORTS_SUCCEEDED = True
except ImportError as e:
    print(f"Import error: {e}", file=sys.stderr)
    IMPORTS_SUCCEEDED = False

# Path settings
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_INDEX_PATH = os.path.join(MODEL_DIR, 'medical_faiss_index.bin')
CORPUS_DATA_PATH = os.path.join(MODEL_DIR, 'medical_corpus_data.pkl')
CSV_PATH = os.path.join(MODEL_DIR, 'mtsamples.csv')
HISTORY_PATH = os.path.join(MODEL_DIR, 'session_history.json')


SESSION_HISTORY = []

def load_session_history():
    if os.path.exists(HISTORY_PATH):
        with open(HISTORY_PATH, 'r') as f:
            return json.load(f)
    return []

def save_session_history(history):
    with open(HISTORY_PATH, 'w') as f:
        json.dump(history, f)


# For debugging and tracing execution
DEBUG = True
def debug_log(message):
    if DEBUG:
        print(f"DEBUG: {message}", file=sys.stderr)

# Fallback data if we can't find the dataset
FALLBACK_DATA = [
    "In General Medicine, symptoms like 'headache' may be evaluated for diagnostic conditions.",
    "Patients in Neurology presenting with 'dizziness' may be assessed for related issues.",
    "In Cardiology, patients with health concerns described as 'chest pain' may receive further evaluation."
]

def load_or_build_model():
    """Load existing model or build a new one if needed"""
    try:
        if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(CORPUS_DATA_PATH):
            debug_log(f"Found existing model files at {FAISS_INDEX_PATH} and {CORPUS_DATA_PATH}")
            try:
                # Load the FAISS index
                index = faiss.read_index(FAISS_INDEX_PATH)
                
                # Load the corpus data
                with open(CORPUS_DATA_PATH, 'rb') as f:
                    data = pickle.load(f)
                    medical_corpus = data['medical_corpus']
                
                debug_log(f"Successfully loaded index with {index.ntotal} vectors and {len(medical_corpus)} documents")
                return True, index, medical_corpus
            except Exception as e:
                debug_log(f"Error loading model: {e}")
                return build_model()
        else:
            debug_log(f"Model files not found at {FAISS_INDEX_PATH} or {CORPUS_DATA_PATH}")
            return build_model()
    except Exception as e:
        debug_log(f"Unexpected error in load_or_build_model: {e}")
        # Return a simple model for demo purposes
        return False, None, FALLBACK_DATA

def build_model():
    """Build the RAG model from scratch"""
    try:
        # Check if we have the dataset
        if not os.path.exists(CSV_PATH):
            debug_log(f"Dataset not found at {CSV_PATH}")
            debug_log("Creating a simple demo model instead")
            return False, None, FALLBACK_DATA
        
        debug_log(f"Found dataset at {CSV_PATH}, building model...")
        
        # Load the clinical text dataset
        df = pd.read_csv(CSV_PATH)
        debug_log(f"Dataset loaded with {len(df)} records")
        
        # Create generalized, de-identified facts from the dataset
        df['medical_fact'] = df.apply(create_generalized_fact, axis=1)
        df = df[df['medical_fact'].str.len() > 30].reset_index(drop=True)
        
        # Extract clean corpus for embedding
        medical_corpus = df['medical_fact'].tolist()
        debug_log(f"Prepared {len(medical_corpus)} facts for embedding")
        
        # Create embeddings
        debug_log("Loading transformer model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Process in batches
        batch_size = 64
        embeddings = []
        
        debug_log("Creating embeddings...")
        for i in range(0, len(medical_corpus), batch_size):
            batch = medical_corpus[i:i+batch_size]
            batch_embeddings = model.encode(batch)
            embeddings.append(batch_embeddings)
            if i % 128 == 0:  # Less verbose logging
                debug_log(f"Processed {min(i+batch_size, len(medical_corpus))}/{len(medical_corpus)}")
        
        # Combine batches
        embeddings = np.vstack(embeddings)
        
        # Build FAISS index
        debug_log("Building FAISS index...")
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(np.array(embeddings).astype('float32'))
        
        # Save for future use
        debug_log(f"Saving model to {FAISS_INDEX_PATH} and {CORPUS_DATA_PATH}")
        try:
            faiss.write_index(index, FAISS_INDEX_PATH)
            with open(CORPUS_DATA_PATH, 'wb') as f:
                pickle.dump({
                    'medical_corpus': medical_corpus,
                    'df_info': {
                        'shape': df.shape
                    }
                }, f)
            debug_log("Model built and saved successfully")
        except Exception as e:
            debug_log(f"Error saving model: {e}")
        
        return True, index, medical_corpus
    except Exception as e:
        debug_log(f"Error building model: {e}")
        return False, None, FALLBACK_DATA

def create_generalized_fact(row):
    """Create a generalized medical fact from a dataset row"""
    try:
        specialty = row['medical_specialty'] if isinstance(row['medical_specialty'], str) else ""
        symptom = row['description'] if isinstance(row['description'], str) else ""
        text = row['transcription'] if isinstance(row['transcription'], str) else ""
        
        # Remove line breaks and lowercase for keyword matching
        text_clean = text.lower().replace("\n", " ").strip()
        
        # Check for diagnostic relevance
        if "diagnosis" in text_clean or "assessment" in text_clean or "impression" in text_clean:
            fact = f"In {specialty}, symptoms like '{symptom}' may be evaluated for diagnostic conditions."
        elif "symptom" in text_clean or "pain" in text_clean or "fever" in text_clean:
            fact = f"Patients in {specialty} presenting with '{symptom}' may be assessed for related issues."
        else:
            fact = f"In {specialty}, patients with health concerns described as '{symptom}' may receive further evaluation."
        
        return fact
    except Exception as e:
        debug_log(f"Error in create_generalized_fact: {e}")
        return "Medical information may help understand symptoms and conditions."

def retrieve_context(query, index, medical_corpus, k=3):
    """Retrieve relevant medical information based on the query"""
    try:
        if index is None or not medical_corpus:
            debug_log("No valid index or corpus, using fallback data")
            return FALLBACK_DATA[:k]
        
        # Load model just for embedding the query
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        query_embedding = model.encode([query])
        distances, indices = index.search(np.array(query_embedding).astype('float32'), k)
        
        # Get the retrieved documents
        retrieved_docs = [medical_corpus[i] for i in indices[0]]
        debug_log(f"Retrieved {len(retrieved_docs)} documents")
        return retrieved_docs
    except Exception as e:
        debug_log(f"Error in retrieve_context: {e}")
        return FALLBACK_DATA[:k]

def ask_sympai(user_input, index, medical_corpus, session_history):
    try:
        debug_log(f"Processing query with history: {user_input}")
        client = Groq(api_key="")
        
        context = retrieve_context(user_input, index, medical_corpus)
        context_block = "\n\nGENERAL CLINICAL BACKGROUND:\n" + "\n\n---\n\n".join(context)
        
        system_prompt = (
            "You are SympAI, a virtual symptom assistant. "
            "You ONLY respond to symptom-related health questions with concise, helpful information. "
            "You must not impersonate any patient or assume personal health data. "
            "Use the clinical background to inform your responses without directly citing it. "
            "Keep responses under 200 words when possible. "
            "Politely decline non-medical requests."
        )

        # Construct chat history messages
        messages = [{"role": "system", "content": system_prompt}]
        for pair in session_history:
            messages.append({"role": "user", "content": pair["user"]})
            messages.append({"role": "assistant", "content": pair["assistant"]})
        
        # Append the new user message with medical context
        messages.append({"role": "user", "content": f"{user_input}\n\n{context_block}"})

        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=messages,
            temperature=0.4,
            max_tokens=600
        )

        result = response.choices[0].message.content.strip()
        session_history.append({"user": user_input, "assistant": result})
        return result

    except Exception as e:
        debug_log(f"Error in ask_sympai: {e}")
        return simple_demo_response(user_input)


def simple_demo_response(query):
    """Generate a simple demo response for when the model isn't available"""
    debug_log("Using simple demo response function")
    
    if "head" in query.lower() or "headache" in query.lower():
        return "Headaches can have various causes ranging from tension and stress to more serious conditions. Common types include tension headaches, migraines, and cluster headaches. It's important to consult with a healthcare provider for persistent or severe headaches."
    elif "chest" in query.lower() or "heart" in query.lower() or "breath" in query.lower():
        return "Chest pain or breathing difficulties can be associated with various conditions ranging from anxiety to serious cardiovascular issues. These symptoms could indicate conditions like anxiety, asthma, or heart-related problems. Please consult with a healthcare provider promptly for proper evaluation, especially if the symptoms are severe."
    elif "fever" in query.lower():
        return "Fever is the body's natural response to infection or illness. Common causes include viral infections like the flu, bacterial infections such as strep throat, or inflammatory conditions. If a fever is high, persists for more than a few days, or is accompanied by severe symptoms, it's important to seek medical attention."
    else:
        return "Based on your description, there could be several possible explanations. For a proper assessment, it would be best to consult with a healthcare provider who can take into account your medical history and perform an examination if needed."

if __name__ == "__main__":
    debug_log(f"Starting SympAI RAG script with args: {sys.argv}")

    # Ensure paths are set before using them
    MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
    HISTORY_PATH = os.path.join(MODEL_DIR, 'session_history.json')

    def load_session_history():
        if os.path.exists(HISTORY_PATH):
            with open(HISTORY_PATH, 'r') as f:
                return json.load(f)
        return []

    def save_session_history(history):
        with open(HISTORY_PATH, 'w') as f:
            json.dump(history, f)

    # Load session history from disk
    SESSION_HISTORY = load_session_history()

    if not IMPORTS_SUCCEEDED:
        debug_log("Required packages are missing. Using simple demo mode.")
        if len(sys.argv) < 2:
            print("Please provide a question about medical symptoms.")
            sys.exit(1)
        user_query = sys.argv[1]
        print(simple_demo_response(user_query))
        sys.exit(0)

    if len(sys.argv) < 2:
        print("Usage: python rag_api.py 'user query'", file=sys.stderr)
        sys.exit(1)

    user_query = sys.argv[1]
    debug_log(f"Received query: {user_query}")

    try:
        success, index, medical_corpus = load_or_build_model()

        if success:
            debug_log("Using full RAG model")
            result = ask_sympai(user_query, index, medical_corpus, SESSION_HISTORY)
            save_session_history(SESSION_HISTORY)
        else:
            debug_log("Using simple demo response")
            result = simple_demo_response(user_query)

        print(result)
    except Exception as e:
        debug_log(f"Critical error: {e}")
        print(simple_demo_response(user_query))
