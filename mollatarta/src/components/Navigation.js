import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import '../styles/Navigation.css';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { t } = useTranslation();
  
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
          <Link to="/">{t('app_name')}</Link>
        </div>
        
        <div className="nav-links">
          <Link 
            to="/farms" 
            className={isActive('/farms') ? 'active' : ''}
          >
            {t('nav.farms')}
          </Link>
          
          <Link 
            to="/products" 
            className={isActive('/products') ? 'active' : ''}
          >
            {t('nav.products')}
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
                    {t('nav.admin_dashboard')}
                  </Link>
                  
                  <Link 
                    to="/admin/users" 
                    className={isActive('/admin/users') ? 'active' : ''}
                  >
                    {t('nav.manage_users')}
                  </Link>
                  
                  <Link 
                    to="/admin/farms" 
                    className={isActive('/admin/farms') ? 'active' : ''}
                  >
                    {t('nav.manage_farms')}
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
                    {t('nav.my_farms')}
                  </Link>
                  
                  <Link 
                    to="/orders-received" 
                    className={isActive('/orders-received') ? 'active' : ''}
                  >
                    {t('nav.orders_received')}
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
                    {t('nav.my_orders')}
                  </Link>
                </>
              )}
              
              <button onClick={handleLogout} className="logout-button">
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={isActive('/login') ? 'active' : ''}
              >
                {t('nav.login')}
              </Link>
              
              <Link 
                to="/signup" 
                className={`signup-button ${isActive('/signup') ? 'active' : ''}`}
              >
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 