import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import '../styles/Auth.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('consumer'); // Default role is consumer
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAdminOption, setShowAdminOption] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const { t } = useTranslation();
  
  useEffect(() => {
    // Check if the special admin query parameter exists
    const searchParams = new URLSearchParams(location.search);
    const adminKey = searchParams.get('adminKey');
    setShowAdminOption(adminKey === 'sfida2023');
  }, [location]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try direct Supabase signup to avoid middleware issues
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role // Include role in user metadata
          }
        }
      });
      
      if (error) {
        console.error("Signup error:", error);
        throw error;
      }
      
      // If signUp was successful, show confirmation message
      if (data && data.user) {
        console.log("User created successfully:", data.user.id);
        
        try {
          // Wait a moment before creating profile to ensure auth user is fully registered
          setTimeout(async () => {
            try {
              // Check if profile already exists
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
                
              if (!existingProfile) {
                // Create profile with bypass RLS option to avoid permission issues
                const { error: profileError } = await supabase.rpc('create_profile', {
                  user_id: data.user.id,
                  user_name: fullName
                });
                
                if (profileError) {
                  console.error("Failed to create profile via RPC:", profileError);
                  
                  // Fallback to direct insert with service role (if available)
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([
                      {
                        id: data.user.id,
                        full_name: fullName,
                        role: role // Include role in profile
                      }
                    ]);
                    
                  if (insertError) {
                    console.error("Direct profile creation also failed:", insertError);
                  } else {
                    console.log("Profile created via direct insert");
                  }
                } else {
                  console.log("Profile created via RPC function");
                  // Update the role since RPC function doesn't handle it
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ role: role })
                    .eq('id', data.user.id);
                    
                  if (updateError) {
                    console.error("Failed to update role:", updateError);
                  }
                }
              } else {
                console.log("Profile already exists");
                // Update existing profile with role
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ role: role })
                  .eq('id', data.user.id);
                  
                if (updateError) {
                  console.error("Failed to update role:", updateError);
                }
              }
            } catch (err) {
              console.error("Error in profile creation:", err);
            }
          }, 1000);
        } catch (profileErr) {
          console.error("Profile creation error:", profileErr);
        }
        
        setMessage('Sign up successful! Please check your email for confirmation.');
        setTimeout(() => navigate('/login'), 5000);
      }
    } catch (error) {
      console.error("Complete signup error:", error);
      setError(error.message || 'Failed to create an account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{t('auth.signup_title')}</h2>
        <p>{t('auth.signup_subtitle')}</p>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">{t('auth.full_name')}</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{t('auth.role')}</label>
            <div className="role-selection">
              <div className={`role-option ${role === 'consumer' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  id="role-consumer"
                  name="role"
                  value="consumer"
                  checked={role === 'consumer'}
                  onChange={() => setRole('consumer')}
                />
                <label htmlFor="role-consumer">
                  <span className="role-icon">🛒</span>
                  <span className="role-label">{t('auth.consumer_role')}</span>
                  <span className="role-description">{t('auth.consumer_desc')}</span>
                </label>
              </div>
              
              <div className={`role-option ${role === 'farmer' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  id="role-farmer"
                  name="role"
                  value="farmer"
                  checked={role === 'farmer'}
                  onChange={() => setRole('farmer')}
                />
                <label htmlFor="role-farmer">
                  <span className="role-icon">🌾</span>
                  <span className="role-label">{t('auth.farmer_role')}</span>
                  <span className="role-description">{t('auth.farmer_desc')}</span>
                </label>
              </div>
              
              {showAdminOption && (
                <div className={`role-option ${role === 'admin' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    id="role-admin"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                  />
                  <label htmlFor="role-admin">
                    <span className="role-icon">⚙️</span>
                    <span className="role-label">{t('auth.admin_role')}</span>
                    <span className="role-description">{t('auth.admin_desc')}</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : t('nav.signup')}
          </button>
        </form>

        <div className="auth-links">
          <p>
            {t('auth.have_account')} <Link to="/login">{t('nav.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 