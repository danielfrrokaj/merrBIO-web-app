import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, authError, resetAuthError } = useAuth();

  // Clear auth errors when component mounts or unmounts
  useEffect(() => {
    resetAuthError();
    return () => resetAuthError();
  }, [resetAuthError]);

  // Display auth errors from context
  useEffect(() => {
    if (authError) {
      setError(authError.message || 'Authentication error');
    }
  }, [authError]);

  // Check for redirect parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      console.log('Will redirect to:', redirect);
    }
  }, [location]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn({ email, password });
      if (error) throw error;
      
      // Check for redirect locations in prioritized order
      const from = location.state?.from;
      const params = new URLSearchParams(location.search);
      const redirectParam = params.get('redirect');
      
      // Determine where to redirect
      if (redirectParam) {
        // First priority: explicit redirect param in URL
        navigate(redirectParam);
      } else if (from && from.pathname !== '/login' && from.pathname !== '/signup') {
        // Second priority: stored location state, but avoid login loops
        navigate(from);
      } else {
        // Default: go to a neutral public page
        navigate('/farms');
      }
    } catch (error) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Log In to Your Account</h2>
        <p>Welcome back to FarmConnect</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 