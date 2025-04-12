import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { FaBars, FaTimes } from 'react-icons/fa';
import '../styles/Navigation.css';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  
  // Handle scroll event to change nav style
  useEffect(() => {
    const handleScroll = () => {
      // If we're scrolled more than 60px down, enable compact mode
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
        // Also close the menu when back at the top
        if (menuOpen) setMenuOpen(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [menuOpen]);
  
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
      
      // Close the menu if it's open
      setMenuOpen(false);
      
      // Finally navigate to home page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Try direct navigation if something fails
      window.location.href = '/';
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Close menu when clicking a link on mobile
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setMenuOpen(false);
    }
  };

  return (
    <nav className={`main-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">
            <img src="/images/logo.png" alt="Molla t'Arta" className="logo-image" />
            <span className="logo-text">Mollat'arta</span>
          </Link>
        </div>
        
        <div className="hamburger-menu" onClick={toggleMenu}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>
        
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link 
            to="/farms" 
            className={isActive('/farms') ? 'active' : ''}
            onClick={handleLinkClick}
          >
            {t('nav.farms')}
          </Link>
          
          <Link 
            to="/products" 
            className={isActive('/products') ? 'active' : ''}
            onClick={handleLinkClick}
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
                    onClick={handleLinkClick}
                  >
                    {t('nav.admin_dashboard')}
                  </Link>
                  
                  <Link 
                    to="/admin/users" 
                    className={isActive('/admin/users') ? 'active' : ''}
                    onClick={handleLinkClick}
                  >
                    {t('nav.manage_users')}
                  </Link>
                  
                  <Link 
                    to="/admin/farms" 
                    className={isActive('/admin/farms') ? 'active' : ''}
                    onClick={handleLinkClick}
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
                    onClick={handleLinkClick}
                  >
                    {t('nav.my_farms')}
                  </Link>
                  
                  <Link 
                    to="/orders-received" 
                    className={isActive('/orders-received') ? 'active' : ''}
                    onClick={handleLinkClick}
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
                    onClick={handleLinkClick}
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
                onClick={handleLinkClick}
              >
                {t('nav.login')}
              </Link>
              
              <Link 
                to="/signup" 
                className={`signup-button ${isActive('/signup') ? 'active' : ''}`}
                onClick={handleLinkClick}
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