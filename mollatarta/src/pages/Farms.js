import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import '../styles/Farms.css';

export default function Farms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFarms, setFilteredFarms] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchFarms() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('farms')
          .select(`
            *,
            products:products(id)
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
              </div>
              
              <div className="farm-content">
                <h3 className="farm-name">{farm.name}</h3>
                
                {farm.location && (
                  <p className="farm-location">
                    <span className="icon">📍</span> {farm.location}
                  </p>
                )}
                
                {farm.description && (
                  <p className="farm-description">{farm.description.substring(0, 100)}
                    {farm.description.length > 100 ? '...' : ''}
                  </p>
                )}
                
                <div className="product-count">
                  <span>{farm.products.count || 0} {t('farms.products_available')}</span>
                </div>
              </div>
              
              <div className="farm-actions">
                <Link to={`/farms/${farm.id}`} className="view-farm-button">
                  {t('farms.view_products')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="auth-links-container">
        <div className="auth-links">
          <p>
            <Link to="/login">{t('nav.login')}</Link> or <Link to="/signup">{t('nav.signup')}</Link> to manage your farms
          </p>
        </div>
      </div>
    </div>
  );
} 