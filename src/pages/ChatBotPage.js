import React, { useState, useEffect, useRef } from 'react';
import './ChatBotPage.css';

// Arrow SVG icon component for the send button
const SendIcon = () => (
  <svg className="send-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

function ChatBotPage() {
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m SympAI, your symptom assistant. How can I help you today?', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to call the SympAI RAG system
  const fetchSympAIResponse = async (userInput) => {
    try {
      setIsLoading(true);
      
      // Update the API URL to point to the backend server
      const response = await fetch('http://localhost:3001/api/sympai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userInput }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch response: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error fetching SympAI response:', error);
      
      // Return a fallback response in case of an error
      return "I'm sorry, I couldn't process your request at the moment. Please try again later.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message to chat
    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');

    // Show typing indicator
    setMessages([...newMessages, { text: '', sender: 'bot', isTyping: true }]);

    // Get response from the RAG-enabled chatbot
    const botResponse = await fetchSympAIResponse(inputText);
    
    // Replace typing indicator with actual response
    setMessages([
      ...newMessages, 
      { text: botResponse, sender: 'bot' }
    ]);
  };

  return (
    <div className="chatbot-page">
      <header className="chatbot-header">
        <h1>SympAI Chat</h1>
        <p className="header-subtitle">Your AI-powered symptom assistant</p>
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.isTyping ? (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                message.text
              )}
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* This element will be scrolled into view */}
        </div>

        <form onSubmit={handleSendMessage} className="message-input">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe your symptoms..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} aria-label="Send message">
            {isLoading ? (
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            ) : (
              <SendIcon />
            )}
          </button>
        </form>
        
        <div className="disclaimer">
          Important: This is not a medical diagnosis. Always consult with healthcare professionals.
        </div>
      </div>
    </div>
  );
}

export default ChatBotPage;