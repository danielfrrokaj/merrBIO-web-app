import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkDatabaseSetup } from '../utils/checkDatabaseSetup';
import '../styles/DbCheck.css';

export default function DbCheck() {
  const [checkResults, setCheckResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function runDatabaseCheck() {
      try {
        setLoading(true);
        const results = await checkDatabaseSetup();
        setCheckResults(results);
      } catch (err) {
        setError(err.message || 'Error checking database setup');
      } finally {
        setLoading(false);
      }
    }

    runDatabaseCheck();
  }, []);

  return (
    <div className="db-check-container">
      <h1>Database Setup Check</h1>
      <p className="description">
        This page checks if your Supabase database is properly configured for the FarmConnect application.
      </p>

      {loading ? (
        <div className="loading">Checking database setup...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : checkResults ? (
        <div className="results-container">
          <div className={`overall-status ${checkResults.success ? 'success' : 'error'}`}>
            <h2>Overall Status: {checkResults.success ? 'OK' : 'Issues Found'}</h2>
          </div>

          {checkResults.messages.length > 0 && (
            <div className="messages">
              <h3>Messages:</h3>
              <ul>
                {checkResults.messages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="setup-checks">
            <h3>Component Checks:</h3>
            <div className="check-items">
              <div className={`check-item ${checkResults.setup.profilesTable ? 'success' : 'error'}`}>
                <span className="check-label">Profiles Table:</span>
                <span className="check-status">{checkResults.setup.profilesTable ? 'OK' : 'Failed'}</span>
              </div>
              
              <div className={`check-item ${checkResults.setup.farmsTable ? 'success' : 'error'}`}>
                <span className="check-label">Farms Table:</span>
                <span className="check-status">{checkResults.setup.farmsTable ? 'OK' : 'Failed'}</span>
              </div>
              
              <div className={`check-item ${checkResults.setup.productsTable ? 'success' : 'error'}`}>
                <span className="check-label">Products Table:</span>
                <span className="check-status">{checkResults.setup.productsTable ? 'OK' : 'Failed'}</span>
              </div>
              
              <div className={`check-item ${checkResults.setup.ordersTable ? 'success' : 'error'}`}>
                <span className="check-label">Orders Table:</span>
                <span className="check-status">{checkResults.setup.ordersTable ? 'OK' : 'Failed'}</span>
              </div>
              
              <div className={`check-item ${checkResults.setup.rpcFunction ? 'success' : 'error'}`}>
                <span className="check-label">RPC Function:</span>
                <span className="check-status">{checkResults.setup.rpcFunction ? 'OK' : 'Failed'}</span>
              </div>
            </div>
          </div>

          <div className="fix-instructions">
            <h3>How to Fix Issues:</h3>
            <ol>
              <li>Run the <code>supabase/schema-fix.sql</code> script in your Supabase SQL editor</li>
              <li>Run the <code>supabase/rpc_functions.sql</code> script to add necessary functions</li>
              <li>Check that Row Level Security (RLS) is properly configured</li>
              <li>Ensure your Supabase URL and keys are correct in the .env file</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="error-message">No results available</div>
      )}

      <div className="nav-links">
        <Link to="/" className="nav-link">Return to Home</Link>
      </div>
    </div>
  );
} 