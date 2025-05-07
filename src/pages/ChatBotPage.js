import React, { useState, useEffect, useRef } from 'react';
import './ChatBotPage.css';

// Microphone SVG icon component
const MicIcon = ({ active }) => (
  <svg 
    className={`mic-icon ${active ? 'active' : ''}`} 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width="12"
    height="12"
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ 
      maxWidth: '14px', 
      maxHeight: '14px',
      display: 'block'
    }}
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="9" y1="22" x2="15" y2="22" />
  </svg>
);

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
  const [hasError, setHasError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize speech recognition if available
  useEffect(() => {
    // Check if speech recognition is supported
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        // Auto-submit after a short delay
        setTimeout(() => {
          handleSendMessage({ preventDefault: () => {} });
        }, 500);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      setSupportsSpeech(true);
    }
    
    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, []);

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus on input field when page loads
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle speech recognition toggle
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  // Function to call the SympAI RAG system
  const fetchSympAIResponse = async (userInput) => {
    setHasError(false);
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
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(`Server error (${response.status}): ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid response from server');
      }
      
      return data.response;
    } catch (error) {
      console.error('Error fetching SympAI response:', error);
      setHasError(true);
      
      // Return error message to display to user
      if (error.message.includes('Server error')) {
        return `I'm having trouble connecting to my knowledge base. Technical details: ${error.message}`;
      } else if (error.message.includes('Invalid response')) {
        return "I received an incomplete response. The system may need maintenance.";
      } else {
        return "I'm experiencing technical difficulties. Please check your connection and try again in a moment.";
      }
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
      { text: botResponse, sender: 'bot', isError: hasError }
    ]);
  };

  const handleKeyDown = (e) => {
    // Submit on Enter key (but allow Shift+Enter for newlines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleRetry = async () => {
    // Get the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(msg => msg.sender === 'user');
    if (lastUserMessageIndex < 0) return;
    
    const lastUserMessage = messages[messages.length - lastUserMessageIndex - 1];
    
    // Remove the error message
    const newMessages = messages.slice(0, -1);
    setMessages([...newMessages, { text: '', sender: 'bot', isTyping: true }]);
    
    // Try again
    const botResponse = await fetchSympAIResponse(lastUserMessage.text);
    
    // Replace typing indicator with new response
    setMessages([
      ...newMessages, 
      { text: botResponse, sender: 'bot', isError: hasError }
    ]);
  };

  const formatMessage = (text) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#2F3E46', textDecoration: 'underline' }}
          >
            {part}
          </a>
        );
      }
      // Add line breaks
      return part.split('\n').map((line, i) => (
        <React.Fragment key={`${index}-${i}`}>
          {line}
          {i !== part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
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
            <div 
              key={index} 
              className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
            >
              {message.isTyping ? (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <>
                  {formatMessage(message.text)}
                  {message.isError && (
                    <button 
                      className="retry-button" 
                      onClick={handleRetry}
                      aria-label="Retry"
                    >
                      ↻ Retry
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* This element will be scrolled into view */}
        </div>

        <form 
          onSubmit={handleSendMessage} 
          className={`message-input-modern ${supportsSpeech ? 'with-speech-button' : ''}`}
        >
          <div className="input-bar">
            {supportsSpeech && (
              <button 
                type="button" 
                className={`speech-button-modern ${isListening ? 'active' : ''}`} 
                onClick={toggleSpeechRecognition}
                aria-label={isListening ? 'Stop listening' : 'Start speech recognition'}
                disabled={isLoading}
              >
                <MicIcon active={isListening} />
              </button>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening...' : 'Describe your symptoms...'}
              disabled={isLoading || isListening}
              aria-label="Message input"
              className="modern-input"
            />
            <button 
              type="submit" 
              className="send-button-modern"
              disabled={isLoading || !inputText.trim()} 
              aria-label="Send message"
            >
              {isLoading ? (
                <span className="typing-indicator">
                  <span></span><span></span><span></span>
                </span>
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
        </form>
        
        <div className="disclaimer">
          Important: This is not a medical diagnosis. Always consult with healthcare professionals.
        </div>
      </div>
    </div>
  );
}

export default ChatBotPage;