import React from 'react';
import '../styles/ProductCard.css';
import FavoriteButton from './FavoriteButton';
import { useTranslation } from 'react-i18next';

export default function ProductCard({ product, isOwner, onEdit, onDelete, onOrder }) {
  const { t, i18n } = useTranslation();
  const defaultImageUrl = 'https://images.unsplash.com/photo-1627484142233-50b739b53e4b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGZhcm0lMjBwcm9kdWN0c3xlbnwwfHwwfHx8MA%3D%3D';

  // Directly display product name and description without attempting translation if the key is a UUID
  const displayName = product.id.includes('-') ? product.name : t(`product_names.${product.id}`, product.name);
  const displayDescription = product.id.includes('-') ? product.description : t(`product_descriptions.${product.id}`, product.description);

  return (
    <div className="product-card">
      <div className="product-image">
        <img 
          src={product.image_url || defaultImageUrl} 
          alt={product.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImageUrl;
          }}
        />
        {!product.available && (
          <div className="unavailable-badge">{t('products.unavailable')}</div>
        )}
        
        {/* Favorite button */}
        <div className="favorite-button-container">
          <FavoriteButton 
            type="product" 
            id={product.id} 
            size="medium"
          />
        </div>
      </div>
      
      <div className="product-content">
        <h3 className="product-name">{displayName}</h3>
        
        {product.description && (
          <p className="product-description">{displayDescription}</p>
        )}
        
        <div className="product-price">
          ${parseFloat(product.price).toFixed(2)}
        </div>
      </div>
      
      <div className="product-actions">
        {isOwner ? (
          <>
            <button onClick={onEdit} className="edit-button">
              {t('products.edit')}
            </button>
            <button onClick={onDelete} className="delete-button">
              {t('products.delete')}
            </button>
          </>
        ) : product.available ? (
          <button onClick={onOrder} className="order-button">
            {t('products.order')}
          </button>
        ) : (
          <button disabled className="order-button disabled">
            {t('products.unavailable')}
          </button>
        )}
      </div>
    </div>
  );
} 