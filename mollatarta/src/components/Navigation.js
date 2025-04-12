import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import '../styles/Navigation.css';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Fetch user profile to get role
  useEffect(() => {
    async function fetchUserProfile() {
      if (user) {
        try {
          setProfileLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user profile:', error);
          } else if (data) {
            setUserRole(data.role);
          }
        } catch (err) {
          console.error('Error in profile fetch:', err);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
        setUserRole(null);
      }
    }
    
    fetchUserProfile();
  }, [user]);
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      // First clear any state that depends on user
      setUserRole(null);
      setProfileLoading(true);
      
      // Then sign out
      await signOut();
      
      // Finally navigate to public page
      navigate('/farms', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Try direct navigation if something fails
      window.location.href = '/farms';
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">FarmConnect</Link>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/farms" 
            className={isActive('/farms') ? 'active' : ''}
          >
            Farms
          </Link>
          
          {user ? (
            <>
              {/* Admin-specific links */}
              {!profileLoading && userRole === 'admin' && (
                <>
                  <Link 
                    to="/admin" 
                    className={isActive('/admin') ? 'active' : ''}
                  >
                    Admin Dashboard
                  </Link>
                  
                  <Link 
                    to="/admin/users" 
                    className={isActive('/admin/users') ? 'active' : ''}
                  >
                    Manage Users
                  </Link>
                  
                  <Link 
                    to="/admin/farms" 
                    className={isActive('/admin/farms') ? 'active' : ''}
                  >
                    Manage Farms
                  </Link>
                </>
              )}
              
              {/* Farmer-specific links */}
              {!profileLoading && userRole === 'farmer' && (
                <>
                  <Link 
                    to="/dashboard" 
                    className={isActive('/dashboard') ? 'active' : ''}
                  >
                    My Farms
                  </Link>
                  
                  <Link 
                    to="/orders-received" 
                    className={isActive('/orders-received') ? 'active' : ''}
                  >
                    Orders Received
                  </Link>
                </>
              )}
              
              {/* Consumer-specific links */}
              {!profileLoading && userRole === 'consumer' && (
                <>
                  <Link 
                    to="/my-orders" 
                    className={isActive('/my-orders') ? 'active' : ''}
                  >
                    My Orders
                  </Link>
                </>
              )}
              
              <button onClick={handleLogout} className="logout-button">
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={isActive('/login') ? 'active' : ''}
              >
                Log In
              </Link>
              
              <Link 
                to="/signup" 
                className={`signup-button ${isActive('/signup') ? 'active' : ''}`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 