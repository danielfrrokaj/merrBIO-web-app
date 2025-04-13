import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import FavoriteButton from '../components/FavoriteButton';
import ContactFarmerModal from '../components/ContactFarmerModal';
import { FaEnvelope } from 'react-icons/fa';
import '../styles/Farms.css';


export default function Farms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFarms, setFilteredFarms] = useState([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const { t } = useTranslation();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFarms() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('farms')
          .select(`
            *,
            products:products(id),
            owner:profiles(id, full_name)
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Process data to add products count
        const processedData = data?.map(farm => ({
          ...farm,
          products: {
            count: farm.products?.length || 0
          }
        })) || [];
        
        setFarms(processedData);
        setFilteredFarms(processedData);
      } catch (error) {
        setError('Error fetching farms: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFarms();
  }, []);

  // Filter farms based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFarms(farms);
      return;
    }
    
    const filtered = farms.filter(farm => 
      farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (farm.location && farm.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (farm.description && farm.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredFarms(filtered);
  }, [searchTerm, farms]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleContactClick = (farm) => {
    if (!user) {
      // If user is not logged in, inform them they need to log in
      alert(t('farms.login_to_contact'));
      navigate('/login');
      return;
    }
    
    // Open the contact modal directly with the selected farm
    setSelectedFarm(farm);
    setContactModalOpen(true);
  };

  const closeContactModal = () => {
    setContactModalOpen(false);
    // Clear selected farm after animation completes
    setTimeout(() => {
      setSelectedFarm(null);
    }, 300);
  };

  return (
    <div className="farms-page">
      <header className="farms-header">
        <h1>{t('farms.discover')}</h1>
        <p>{t('farms.browse')}</p>
        
        <div className="search-container">
          <input
            type="text"
            placeholder={t('farms.search_placeholder')}
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="clear-search">
              ✕
            </button>
          )}
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner">Loading farms...</div>
      ) : filteredFarms.length === 0 ? (
        <div className="no-results">
          <p>{t('farms.no_results')}</p>
          {searchTerm && (
            <button onClick={clearSearch} className="secondary-button">
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="farms-grid">
          {filteredFarms.map(farm => (
            <div key={farm.id} className="farm-card public">
              <div className="farm-image">
                <img 
                  src={farm.image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGZhcm18ZW58MHx8MHx8fDA%3D'} 
                  alt={farm.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGZhcm18ZW58MHx8MHx8fDA%3D';
                  }}
                />
                
                <div className="favorite-button-container">
                  <FavoriteButton 
                    type="farm" 
                    id={farm.id} 
                    size="medium"
                  />
                </div>
              </div>
              
              <div className="farm-content">
                <h3 className="farm-name">{farm.name}</h3>
                
                {farm.location && (
                  <p className="farm-location">
                    <span className="icon">📍</span> {farm.location}
                  </p>
                )}
                
                {farm.description && (
                  <p className="farm-description">
                    {t(`farm_descriptions.${farm.id}`) || farm.description.substring(0, 100)}
                    {farm.description.length > 100 ? '...' : ''}
                  </p>
                )}
                
                <div className="product-count">
                  <span>{farm.products.count || 0} {t('farms.products_available')}</span>
                </div>
              </div>
              
              <div className="farm-actions">
                <button 
                  onClick={() => handleContactClick(farm)} 
                  className="contact-farmer-button"
                >
                  <FaEnvelope className="button-icon" /> {t('farms.contact_farmer')}
                </button>
                
                <Link to={`/farms/${farm.id}`} className="view-farm-button">
                  {t('farms.view_products')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

{!userRole === 'consumer' && (
      <div className="auth-links-container">
        <div className="auth-links">
          <p>
            You need to set a role to manage your farms. Please contact support for assistance.
          </p>
        </div>
      </div>
    )}
    </div>
  );
} 