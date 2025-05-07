import React, { useState, useEffect } from 'react';
import './ChatBotPage.css';

function ChatBotPage() {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I help you today?', sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const userId = parseInt(localStorage.getItem('user_id'));

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5000/chat-history/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setChatHistory(data.chat_history);
         // const formatted = data.chat_history.map(chat => ([
          //  { text: chat.message, sender: 'user' },
          //  { text: chat.response, sender: 'bot' }
         // ])).flat();
         // setMessages(formatted);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    if (userId) fetchChatHistory();
  }, [userId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages(newMessages);
    const userMessage = inputText;
    setInputText('');

    setTimeout(() => {
      const botResponse = {
        text: `I'm your AI assistant. I'm still learning how to respond to "${userMessage}"`,
        sender: 'bot'
      };

      setMessages(prev => [...prev, botResponse]);

      // Save user message + bot response to backend
      saveChatToBackend(userId, userMessage, botResponse.text);
    }, 1000);
  };

  const saveChatToBackend = async (userId, message, response) => {
    try {
      await fetch('http://localhost:5000/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message, response }),
      });
    } catch (err) {
      console.error('Error saving chat:', err);
    }
  };

   return (
    <div className="chatbot-page">
      <header className="chatbot-header">
        <h1>SympAI Chat</h1>
      </header>

      <div className="chat-container">
        <div className="chat-history">
          <h2>Previous Chats</h2>
          {chatHistory.map((chat, index) => (
            <div key={index} className="history-item">
              <div><strong>You:</strong> {chat.message}</div>
              <div><strong>Bot:</strong> {chat.response}</div>
              <div className="timestamp">{new Date(chat.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>

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