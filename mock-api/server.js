const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create Express server
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Function to log messages with timestamp
function logMessage(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // Also log to a file for debugging
  const logFile = path.join(logsDir, 'server.log');
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

// Function to call the Python RAG implementation
function callPythonRAG(query) {
  return new Promise((resolve, reject) => {
    logMessage(`Calling Python RAG with query: "${query}"`);
    
    // Spawn a Python process to run the RAG functionality
    const pythonProcess = spawn('python', ['./src/pages/rag_api.py', query]);
    
    let responseData = '';
    let errorData = '';
    
    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      responseData += data.toString();
      logMessage(`Python stdout: ${data.toString().trim()}`);
    });
    
    // Collect error data if any
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      logMessage(`Python stderr: ${data.toString().trim()}`);
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      logMessage(`Python process exited with code ${code}`);
      
      if (code !== 0) {
        logMessage(`Error: ${errorData}`);
        // Fall back to hardcoded responses if Python fails
        resolve(getFallbackResponse(query));
        return;
      }
      
      try {
        const result = responseData.trim();
        logMessage(`RAG response received (${result.length} chars)`);
        resolve(result);
      } catch (error) {
        logMessage(`Error parsing Python response: ${error}`);
        resolve(getFallbackResponse(query));
      }
    });
  });
}

// Fallback responses for when Python execution fails
function getFallbackResponse(query) {
  logMessage(`Using fallback response for: "${query}"`);
  
  // Simple keyword matching for demo fallback
  if (query.toLowerCase().includes('chest pain') || query.toLowerCase().includes('breath')) {
    return "Chest pain and shortness of breath can be associated with various conditions ranging from anxiety to serious cardiovascular issues. These symptoms could indicate conditions like anxiety, asthma, pneumonia, bronchitis, pulmonary embolism, or heart-related problems such as angina or myocardial infarction. It's important to note that chest pain with shortness of breath could potentially indicate a serious medical condition that requires immediate attention. Please consult with a healthcare provider promptly for proper evaluation and diagnosis, especially if the symptoms are severe or persistent.";
  } else if (query.toLowerCase().includes('fever') || query.toLowerCase().includes('headache')) {
    return "Fever and headache can be symptoms of various conditions including viral infections like influenza or COVID-19, bacterial infections, or other inflammatory conditions. The combination could indicate something as common as a cold or flu, or could be part of a more specific condition. Please consult with a healthcare provider for proper diagnosis and treatment recommendations.";
  } else if (query.toLowerCase().includes('cough') || query.toLowerCase().includes('sore throat')) {
    return "Cough and sore throat are common symptoms of upper respiratory infections, which can be caused by viruses (like the common cold, flu, or COVID-19) or bacteria. Other possible causes include allergies, post-nasal drip, or environmental irritants. If these symptoms persist beyond a week, are severe, or are accompanied by high fever or difficulty breathing, please consult with a healthcare provider for proper evaluation and treatment recommendations.";
  } else if (query.toLowerCase().includes('rash') || query.toLowerCase().includes('itching')) {
    return "Skin rashes and itching can result from various conditions including allergic reactions, infections (bacterial, viral, or fungal), autoimmune disorders, or contact with irritants. The specific appearance, location, and duration of the rash are important factors in determining its cause. I recommend consulting with a healthcare provider who can visually examine the rash and consider your complete medical history for accurate diagnosis and treatment.";
  } else if (query.toLowerCase().includes('stomach') || query.toLowerCase().includes('nausea') || query.toLowerCase().includes('vomiting')) {
    return "Stomach discomfort, nausea, and vomiting can be caused by various conditions including viral gastroenteritis (stomach flu), food poisoning, medication side effects, or more serious conditions like appendicitis or gallbladder issues. If symptoms are severe, persistent, or accompanied by high fever or severe abdominal pain, please seek prompt medical attention. Staying hydrated is important while experiencing these symptoms.";
  } else {
    return "I understand you're describing some health concerns. Based on general medical knowledge, these symptoms could be associated with various conditions. However, for accurate diagnosis and appropriate treatment, it's essential to consult with a qualified healthcare provider who can perform a thorough examination and consider your complete medical history.";
  }
}

// API endpoint for SympAI
app.post('/api/sympai', async (req, res) => {
  const { query } = req.body;
  
  logMessage(`Received query: "${query}"`);
  
  try {
    // Call the Python RAG implementation
    const botResponse = await callPythonRAG(query);
    
    // Send the response back to the client
    res.json({ response: botResponse });
    logMessage(`Response sent to client (${botResponse.length} chars)`);
  } catch (error) {
    logMessage(`Error calling RAG system: ${error}`);
    // Use fallback response if there's an error
    const fallbackResponse = getFallbackResponse(query);
    res.json({ response: fallbackResponse });
    logMessage(`Fallback response sent to client`);
  }
});

// Start server
app.listen(port, () => {
  logMessage(`SympAI mock API server is running on http://localhost:${port}`);
  logMessage(`Using RAG system from Python notebook for responses`);
});