import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically handle authentication
    console.log('Login attempt with:', email);
    
    // For now, just navigate to the chat page
    navigate('/chat');
  };

  return (
    <div className="login-container">
      <div className="login-page">
        <div className="forms-wrapper">
        <h1>Sign In</h1>
        <form onSubmit={handleSubmit} className='forms'>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">
            LOGIN
          </button>
        </form>
        </div>
      </div>

      <div className='signup-direct'>
        <div className='welcome-msg'>
            <h2>Welcome Back!</h2>
            <p>Don't have an account?</p>
            <button className='signup-btn'>SIGN UP</button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;