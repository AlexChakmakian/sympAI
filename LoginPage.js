import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // To display any login errors
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login success:', data);

        // You can save any token or user info to local storage or context here

        // Redirect to chat page after successful login
        navigate('/chat');
      } else {
        const err = await response.json();

        if(response.status === 401) {
          setError('Incorrect password. Please try again.');
        } else if (response.status === 404){
          setError('No account found with that email. Please register first.');
        } else {
          setError(err.message || 'Login failed');
        }
      }
    } catch (err) {
      setError('Something went wrong.');
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-page">
        <div className="forms-wrapper">
          <h1>Sign In</h1>
          {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}
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
            <button type="submit" className="login-button">
              LOGIN
            </button>
          </form>
        </div>
      </div>

      <div className="signup-direct">
        <div className="welcome-msg">
          <h2>Welcome Back!</h2>
          <p>Don't have an account?</p>
          <button className="signup-btn" onClick={() => navigate('/register')}> SIGN UP</button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
