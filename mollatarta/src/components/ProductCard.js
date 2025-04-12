import React from 'react';
import '../styles/ProductCard.css';

export default function ProductCard({ product, isOwner, onEdit, onDelete, onOrder }) {
  const defaultImageUrl = 'https://images.unsplash.com/photo-1627484142233-50b739b53e4b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGZhcm0lMjBwcm9kdWN0c3xlbnwwfHwwfHx8MA%3D%3D';

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
          <div className="unavailable-badge">Not Available</div>
        )}
      </div>
      
      <div className="product-content">
        <h3 className="product-name">{product.name}</h3>
        
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        
        <div className="product-price">
          ${parseFloat(product.price).toFixed(2)}
        </div>
      </div>
      
      <div className="product-actions">
        {isOwner ? (
          <>
            <button onClick={onEdit} className="edit-button">
              Edit
            </button>
            <button onClick={onDelete} className="delete-button">
              Delete
            </button>
          </>
        ) : product.available ? (
          <button onClick={onOrder} className="order-button">
            Order
          </button>
        ) : (
          <button disabled className="order-button disabled">
            Unavailable
          </button>
        )}
      </div>
    </div>
  );
} 