import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './ChatBotPage.css';
import sympAILogo from '../sympAI_logo.png';

// Icons
const MicIcon = ({ active }) => (
  <svg className={`mic-icon ${active ? 'active' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ maxWidth: '14px', maxHeight: '14px', display: 'block' }}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="9" y1="22" x2="15" y2="22" />
  </svg>
);

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
  const [isListening, setIsListening] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const userId = parseInt(localStorage.getItem('user_id'));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('2025-05-29');
  const [selectedTime, setSelectedTime] = useState('');
  const doctorOptions = [
    { name: "Dr. Merdula Patel", specialty: "Cardiologist", location: "Los Angeles, CA" },
    { name: "Dr. Lisa Kim", specialty: "Dermatologist", location: "Los Angeles, CA" },
    { name: "Dr. Micheal Nguyen", specialty: "Pediatrician", location: "Los Angeles, CA" },
    { name: "Dr. Emily Lee", specialty: "Neurologist", location: "Los Angeles, CA" },
    { name: "Dr. Ana Martinez", specialty: "Endocrinologist", location: "Los Angeles, CA" },
    { name: "Dr. John Kim", specialty: "ENT Specialist", location: "Los Angeles, CA" },
    { name: "Dr. Natalie Brown", specialty: "Family Medicine", location: "Los Angeles, CA" },
    { name: "Dr. Samuel Everett", specialty: "Gastroenterologist", location: "Los Angeles, CA" },
    { name: "Dr. Priya Nandini", specialty: "Rheumatologist", location: "Los Angeles, CA" },
  ];
  const availableTimes = {
    '2025-05-29': ['09:00 AM', '10:30 AM', '01:00 PM', '03:00 PM'],
    '2025-05-30': ['11:00 AM', '02:00 PM'],
    '2025-05-31': ['09:00 AM', '12:00 PM', 'Unavailable', '04:00 PM'],
    '2025-06-01': ['10:00 AM', 'Unavailable', '01:30 PM'],
    '2025-06-02': ['Unavailable', '11:00 AM', '03:00 PM'],
    '2025-06-03': ['09:30 AM', 'Unavailable', '02:00 PM'],
    '2025-06-04': ['Unavailable', 'Unavailable', 'Unavailable'],
    '2025-06-05': ['10:00 AM', '12:00 PM', 'Unavailable'],
  };

  useEffect(() => {
    // Speech Recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 500);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);

      setSupportsSpeech(true);
    }

    if (userId) {
      fetch(`http://localhost:5000/chat-history/${userId}`)
        .then(res => res.json())
        .then(data => setChatHistory(data.chat_history || []))
        .catch(err => console.error('Chat history error:', err));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const fetchSympAIResponse = async (userInput) => {
    setHasError(false);
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/sympai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userInput }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      return data.response || "I couldn't understand that.";
    } catch (err) {
      console.error(err);
      setHasError(true);
      return "I'm experiencing technical difficulties. Please try again.";
    } finally {
      setIsLoading(false);
    }
  };

  const saveChatToBackend = async (message, response) => {
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessages = [...messages, { text: inputText, sender: 'user' }];
    setMessages([...newMessages, { text: '', sender: 'bot', isTyping: true }]);
    const userMessage = inputText;
    setInputText('');

    const botResponse = await fetchSympAIResponse(userMessage);

    setMessages([
      ...newMessages,
      { text: botResponse, sender: 'bot', isError: hasError }
    ]);

    if (!hasError) saveChatToBackend(userMessage, botResponse);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleChatClick = (chat) => {
    setMessages([
      { text: chat.message, sender: 'user' },
      { text: chat.response, sender: 'bot' }
    ]);
  };

  const formatMessage = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) =>
      part.match(urlRegex) ? (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div className="chatbot-page">
      <header className="chatbot-header">
        <Link to="/" className="logo-link">
          <img src={sympAILogo} alt="SympAI Logo" className="logo" />
        </Link>
        <p className="header-subtitle">Your AI-powered symptom assistant</p>
      </header>

      <div className="chat-container">
        <div className="chat-history">
          <h2>Previous Chats</h2>
          {chatHistory.map((chat, index) => (
            <div key={index} className="history-item" onClick={() => handleChatClick(chat)}>
              <div><strong>You:</strong> {chat.message}</div>
              <div><strong>Bot:</strong> {chat.response}</div>
              <div className="timestamp">{new Date(chat.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="chat-main">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender} ${message.isError ? 'error' : ''}`}>
                {message.isTyping ? (
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                ) : formatMessage(message.text)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className={`message-input-modern ${supportsSpeech ? 'with-speech-button' : ''}`}>
            <div className="input-bar">
              {supportsSpeech && (
                <button type="button" className={`speech-button-modern ${isListening ? 'active' : ''}`} onClick={toggleSpeechRecognition} aria-label="Toggle speech" disabled={isLoading}>
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
                className="modern-input"
              />
              <button type="submit" className="send-button-modern" disabled={isLoading || !inputText.trim()} aria-label="Send">
                {isLoading ? <div className="typing-indicator"><span></span><span></span><span></span></div> : <SendIcon />}
              </button>
            </div>
          </form>

          <div className="disclaimer">Important: This is not a medical diagnosis. Always consult with healthcare professionals.</div>
        </div>

        {/* Right-side appointment booking panel */}
        <div className="appointment-panel">
          <div className="appointment-box">
            <div
              className="appointment-header"
              onClick={() => setIsDropdownOpen((open) => !open)}
              tabIndex={0}
              role="button"
              aria-expanded={isDropdownOpen}
            >
              <span>Book an Appointment for Your Symptoms</span>
              <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
            </div>
            {isDropdownOpen && (
              <div className="appointment-dropdown">
                {doctorOptions.map((doc, idx) => (
                  <div
                    className="doctor-option"
                    key={idx}
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setShowBookingModal(true);
                      setSelectedDate('2025-05-29');
                      setSelectedTime('');
                    }}
                  >
                    <div className="doctor-name">{doc.name}</div>
                    <div className="doctor-specialty">{doc.specialty}</div>
                    <div className="doctor-location">{doc.location}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBookingModal(false)}>×</button>
            <h2>Book Appointment with {selectedDoctor?.name}</h2>
            <div className="modal-section">
              <label>Select Date:</label>
              <input
                type="date"
                min="2025-05-29"
                max="2025-06-05"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                }}
              />
            </div>
            <div className="modal-section">
              <label>Select Time:</label>
              <div className="time-options">
                {(availableTimes[selectedDate] || ['Unavailable']).map((time, i) => (
                  <button
                    key={i}
                    className={`time-btn${selectedTime === time ? ' selected' : ''}${time === 'Unavailable' ? ' unavailable' : ''}`}
                    disabled={time === 'Unavailable'}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            {selectedTime && selectedTime !== 'Unavailable' && (
              <div className="modal-confirm modal-confirm-center">
                <button className="confirm-btn" onClick={() => setShowBookingModal(false)}>
                  Book Appointment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBotPage;