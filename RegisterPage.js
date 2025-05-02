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

        // After successful registration, navigate to login page
        navigate('/login');
      } else {
        const err = await response.json();
        setError(err.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong.');
      console.error(err);
    }
  };

  return (
    <div className="register-container">
      <div className="register-page">
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
