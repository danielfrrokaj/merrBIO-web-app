import React, { useState } from 'react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import '../styles/FavoriteButton.css';

const FavoriteButton = ({ type, id, size = 'medium', showToast = true, className = '' }) => {
  const { user, isFavorited, addToFavorites, removeFromFavorites } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  
  // Check if the item is in favorites
  const isFavorite = isFavorited(type, id);
  
  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user is not logged in, we could redirect to login or show a message
    if (!user) {
      if (showToast) {
        toast.info(t('favorites.login_required'));
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isFavorite) {
        await removeFromFavorites(type, id);
        if (showToast) {
          toast.success(t('favorites.removed'));
        }
      } else {
        await addToFavorites(type, id);
        if (showToast) {
          toast.success(t('favorites.added'));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (showToast) {
        toast.error(error.message || 'Error updating favorites');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      className={`favorite-button ${size} ${isFavorite ? 'active' : ''} ${isLoading ? 'loading' : ''} ${className}`}
      onClick={handleToggleFavorite}
      title={isFavorite ? t('favorites.remove') : t('favorites.add')}
      disabled={isLoading}
    >
      {isFavorite ? <FaHeart /> : <FaRegHeart />}
    </button>
  );
};

export default FavoriteButton; 