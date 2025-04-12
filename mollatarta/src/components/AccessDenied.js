import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AccessDenied.css';

export default function AccessDenied() {
  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="access-denied-icon">🔒</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <div className="access-denied-actions">
          <Link to="/" className="primary-button">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
} 