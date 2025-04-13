import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt, FaLeaf, FaHeart } from 'react-icons/fa';
import '../styles/Favorites.css';

export default function Favorites() {
  const { user, favorites, fetchUserFavorites, removeFromFavorites } = useAuth();
  const [activeTab, setActiveTab] = useState('farms');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  
  useEffect(() => {
    async function loadFavorites() {
      setLoading(true);
      await fetchUserFavorites();
      setLoading(false);
    }
    
    if (user) {
      loadFavorites();
    }
  }, [user, fetchUserFavorites]);
  
  const handleRemoveFavorite = async (type, id) => {
    await removeFromFavorites(type, id);
  };
  
  if (!user) {
    return (
      <div className="favorites-page">
        <div className="login-required">
          <h2>{t('favorites.login_required')}</h2>
          <p>{t('favorites.login_message')}</p>
          <Link to="/login" className="primary-button">
            {t('nav.login')}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>{t('favorites.title')}</h1>
        <p>{t('favorites.subtitle')}</p>
        
        <div className="favorites-tabs">
          <button 
            className={`tab-button ${activeTab === 'farms' ? 'active' : ''}`}
            onClick={() => setActiveTab('farms')}
          >
            {t('favorites.farms')} ({favorites.farms.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            {t('favorites.products')} ({favorites.products.length})
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-spinner">{t('favorites.loading')}</div>
      ) : (
        <div className="favorites-content">
          {activeTab === 'farms' && (
            <div className="farms-grid">
              {favorites.farms.length > 0 ? (
                favorites.farms.map((favorite) => {
                  const farm = favorite.farm;
                  return (
                    <div key={favorite.id} className="farm-card">
                      <button 
                        className="remove-favorite" 
                        onClick={() => handleRemoveFavorite('farm', farm.id)}
                        title={t('favorites.remove')}
                      >
                        <FaHeart />
                      </button>
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
                            <FaMapMarkerAlt className="icon" />
                            <span>{farm.location || 'Location unavailable'}</span>
                          </p>
                        )}
                        
                        <div className="product-count">
                          <FaLeaf className="icon" /> {farm.product_count || '0'} {t('farms.products_available')}
                        </div>
                      </div>
                      
                      <div className="farm-actions">
                        <Link to={`/farms/${farm.id}`} className="view-farm-button">
                          {t('farms.view_products')}
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <h3>{t('favorites.no_farms')}</h3>
                  <p>{t('favorites.browse_farms_message')}</p>
                  <Link to="/farms" className="primary-button">
                    {t('favorites.browse_farms')}
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'products' && (
            <div className="products-grid">
              {favorites.products.length > 0 ? (
                favorites.products.map((favorite) => {
                  const product = favorite.product;
                  return (
                    <div key={favorite.id} className="product-card">
                      <button 
                        className="remove-favorite" 
                        onClick={() => handleRemoveFavorite('product', product.id)}
                        title={t('favorites.remove')}
                      >
                        <FaHeart />
                      </button>
                      <div className="product-image">
                        <img 
                          src={product.image_url || 'https://via.placeholder.com/300x200?text=Product'}
                          alt={product.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x200?text=Product';
                          }}
                        />
                      </div>
                      
                      <div className="product-content">
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-price">${product.price.toFixed(2)}</p>
                        <p className="product-farm">
                          {t('home.from')}: {product.farm?.name || t('home.unknown_farm')}
                        </p>
                      </div>
                      
                      <div className="product-actions">
                        <Link to={`/order/${product.id}`} className="order-button">
                          {t('home.view_details')}
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <h3>{t('favorites.no_products')}</h3>
                  <p>{t('favorites.browse_products_message')}</p>
                  <Link to="/products" className="primary-button">
                    {t('favorites.browse_products')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 