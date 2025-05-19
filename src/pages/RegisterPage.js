import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Registration success:', data);
        navigate('/login');
      } else {
        const err = await response.json();
      
        if (response.status === 409) {
          setError('An account with this email already exists. Please log in.');
        } else if (response.status === 400) {
          setError('Please fill in all required fields.');
        } else {
          setError(err.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Something went wrong.');
      console.error(err);
    }
  };

  const handleSkipRegister = () => {
    // Set a flag in localStorage to indicate this is a guest session
    localStorage.setItem('is_guest', 'true');
    navigate('/chat');
  };

  return (
    <div className="register-container">
      <div className="register-page">
        <div className="register-logo-top-wrapper">
          <img
            src={require('../sympAI2.png')}
            alt="SympAI Logo"
            className="register-logo-top"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', height: '48px', marginBottom: '1.5rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
          />
        </div>
        <div className="forms-wrapper">
          <h1>Sign Up</h1>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleSubmit} className="forms">
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
            <button type="submit" className="register-button">
              REGISTER
            </button>
          </form>
          <div className="skip-register">
            <button onClick={handleSkipRegister} className="skip-register-button">
              Continue as Guest
            </button>
          </div>
        </div>
      </div>

      <div className="login-direct">
        <div className="welcome-msg">
          <h2>Welcome!</h2>
          <p>Already have an account?</p>
          <button className="login-btn" onClick={() => navigate('/login')}>LOGIN</button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
