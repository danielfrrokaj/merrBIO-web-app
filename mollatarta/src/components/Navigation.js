import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { FaBars, FaTimes, FaUser, FaHeart } from 'react-icons/fa';
import '../styles/Navigation.css';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { t } = useTranslation();
  
  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      
      // Close menus when resizing to prevent UI issues
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle white background pages
  useEffect(() => {
    // Pages with white backgrounds that need dark text
    const whiteBackgroundPages = ['/farms', '/products', '/favorites', '/categories', '/order', '/profile', '/my-orders', '/orders-received', '/dashboard', '/login', '/signup'];
    
    // Check if current path matches any white background page
    const isWhiteBackground = whiteBackgroundPages.some(page => 
      location.pathname.startsWith(page)
    );
    
    // Add or remove the white-bg class from body
    if (isWhiteBackground) {
      document.body.classList.add('white-bg');
    } else {
      document.body.classList.remove('white-bg');
    }
    
    return () => {
      // Cleanup on unmount
      document.body.classList.remove('white-bg');
    };
  }, [location.pathname]);
  
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
  
  // Fetch user profile to get role and avatar
  useEffect(() => {
    async function fetchUserProfile() {
      if (user) {
        try {
          setProfileLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('role, full_name, avatar_url')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user profile:', error);
          } else if (data) {
            setUserRole(data.role);
            setUserName(data.full_name || '');
            setProfileImage(data.avatar_url);
          }
        } catch (err) {
          console.error('Error in profile fetch:', err);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
        setUserRole(null);
        setProfileImage(null);
        setUserName('');
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
      setUserMenuOpen(false);
      
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
    // If we're opening the menu, close user dropdown first
    if (!menuOpen && userMenuOpen) {
      setUserMenuOpen(false);
    }
    setMenuOpen(!menuOpen);
  };
  
  const toggleUserMenu = () => {
    // If on mobile and main menu is not open, toggle it first
    if (isMobile && !menuOpen) {
      setMenuOpen(true);
      // Small delay before opening user menu for better UX
      setTimeout(() => {
        setUserMenuOpen(true);
      }, 100);
    } else {
      setUserMenuOpen(!userMenuOpen);
    }
  };

  // Close menu when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setMenuOpen(false);
    }
    setUserMenuOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only apply this on desktop; mobile has different behavior
      if (!isMobile && userMenuOpen && !event.target.closest('.user-avatar-container')) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen, isMobile]);

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
              
              {/* User avatar and dropdown */}
              <div className="user-avatar-container">
                <div className="user-avatar" onClick={toggleUserMenu}>
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt={userName || t('nav.user_profile')} 
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      <FaUser />
                    </div>
                  )}
                </div>
                
                {userMenuOpen && (
                  <div className="user-dropdown">
                    {!profileLoading && userName && (
                      <div className="user-name">{userName}</div>
                    )}
                    
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={handleLinkClick}
                    >
                      <FaUser className="dropdown-icon" />
                      {t('nav.profile')}
                    </Link>
                    
                    <Link 
                      to="/favorites" 
                      className="dropdown-item"
                      onClick={handleLinkClick}
                    >
                      <FaHeart className="dropdown-icon" />
                      {t('nav.favorites')}
                    </Link>
                    
                    <button 
                      onClick={handleLogout} 
                      className="dropdown-item logout-item"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
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