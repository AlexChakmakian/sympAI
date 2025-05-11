import React from 'react';
import { Link } from 'react-router-dom';
import '../sympAI_logo.png';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="modern-landing-bg">
      <div className="modern-navbar-bar" />
      <nav className="modern-navbar modern-navbar-centered">
        <div className="modern-navbar-left">
          <img src={require('../sympAI_logo.png')} alt="SympAI Logo" className="modern-logo" />
        </div>
        <Link to="/login" className="modern-login-btn">Login</Link>
      </nav>
      <main className="modern-main-content">
        <section className="modern-hero">
          <h1 className="modern-hero-title">
            Your <span className="highlight">AI Health Assistant</span>
          </h1>
          <p className="modern-hero-subtitle">
            Get instant, reliable answers to your health questions. Our AI-powered assistant provides personalized guidance based on medical expertise.
          </p>
          <div className="modern-hero-buttons">
            <Link to="/login" className="modern-btn primary">Get Started</Link>
          </div>
        </section>
        <section className="modern-features same-size-features">
          <div className="modern-feature-card same-size-card">
            <span className="modern-feature-icon" role="img" aria-label="diagnosis">🔍</span>
            <h3>Smart Diagnosis</h3>
            <p>Get instant insights about your symptoms</p>
          </div>
          <div className="modern-feature-card same-size-card">
            <span className="modern-feature-icon" role="img" aria-label="support">💬</span>
            <h3>24/7 Support</h3>
            <p>Chat anytime, anywhere</p>
          </div>
          <div className="modern-feature-card same-size-card">
            <span className="modern-feature-icon" role="img" aria-label="secure">🔒</span>
            <h3>Secure & Private</h3>
            <p>Your health data is protected</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;