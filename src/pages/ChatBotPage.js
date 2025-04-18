import React, { useState } from 'react';
import './ChatBotPage.css';

function ChatBotPage() {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I help you today?', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message to chat
    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);
    setInputText('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      setMessages([
        ...newMessages, 
        { text: `I'm your AI assistant. I'm still learning how to respond to "${inputText}"`, sender: 'bot' }
      ]);
    }, 1000);
  };

  return (
    <div className="chatbot-page">
      <header className="chatbot-header">
        <h1>SympAI Chat</h1>
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="message-input">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatBotPage;