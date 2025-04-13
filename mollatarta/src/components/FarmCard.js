import React from 'react';
import '../styles/FarmCard.css';
import FavoriteButton from './FavoriteButton';

export default function FarmCard({ farm, onEdit, onDelete, onViewProducts, showFavorite = true }) {
  const defaultImageUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGZhcm18ZW58MHx8MHx8fDA%3D';

  return (
    <div className="farm-card">
      <div className="farm-image">
        <img 
          src={farm.image_url || defaultImageUrl} 
          alt={farm.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImageUrl;
          }}
        />
        
        {/* Favorite button */}
        {showFavorite && (
          <div className="favorite-button-container">
            <FavoriteButton 
              type="farm" 
              id={farm.id} 
              size="medium"
            />
          </div>
        )}
      </div>
      
      <div className="farm-content">
        <h3 className="farm-name">{farm.name}</h3>
        
        {farm.location && (
          <p className="farm-location">
            <span className="icon">📍</span> {farm.location}
          </p>
        )}
        
        {farm.description && (
          <p className="farm-description">{farm.description}</p>
        )}
      </div>
      
      <div className="farm-actions">
        <button onClick={onViewProducts} className="primary-button">
          Products
        </button>
        <button onClick={onEdit} className="secondary-button">
          Edit
        </button>
        <button onClick={onDelete} className="delete-button">
          Delete
        </button>
      </div>
    </div>
  );
} 