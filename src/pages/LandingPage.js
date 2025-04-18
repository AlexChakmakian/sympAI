import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="content">
        <p className="tagline">Lorem ipsum dolor</p>
        <h1 className="title">Project</h1>
        <p className="subtitle">
          Lorem ipsum dolor sit amet, Lorem ipsum dolor sit amet, <br />
          Lorem ipsum dolor sit amet,
        </p>
        <Link to="/login" className="cta-button">
          START CHATTING
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;