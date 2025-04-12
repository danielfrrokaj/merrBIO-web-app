import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Basket.css';

const Basket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [basketItems, setBasketItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchBasketItems();
  }, [user, navigate]);

  const fetchBasketItems = async () => {
    try {
      setLoading(true);
      
      // Get basket items with product details
      const { data, error } = await supabase
        .from('basket_items')
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            image_url,
            farm_id,
            farms (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Calculate total price
      let total = 0;
      data.forEach(item => {
        total += item.products.price * item.quantity;
      });
      
      setBasketItems(data);
      setTotalPrice(total);
    } catch (err) {
      console.error('Error fetching basket:', err);
      setError('Failed to load your basket. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (basketItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const { error } = await supabase
        .from('basket_items')
        .update({ quantity: newQuantity })
        .eq('id', basketItemId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedItems = basketItems.map(item => {
        if (item.id === basketItemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      
      setBasketItems(updatedItems);
      
      // Recalculate total
      let total = 0;
      updatedItems.forEach(item => {
        total += item.products.price * item.quantity;
      });
      setTotalPrice(total);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity. Please try again.');
    }
  };

  const removeItem = async (basketItemId) => {
    try {
      const { error } = await supabase
        .from('basket_items')
        .delete()
        .eq('id', basketItemId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedItems = basketItems.filter(item => item.id !== basketItemId);
      setBasketItems(updatedItems);
      
      // Recalculate total
      let total = 0;
      updatedItems.forEach(item => {
        total += item.products.price * item.quantity;
      });
      setTotalPrice(total);
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item. Please try again.');
    }
  };

  const proceedToCheckout = () => {
    // Navigate to checkout page
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="basket-container">
        <h1>Your Basket</h1>
        <div className="loading">Loading your basket...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="basket-container">
        <h1>Your Basket</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="basket-container">
      <h1>Your Basket</h1>
      
      {basketItems.length === 0 ? (
        <div className="empty-basket">
          <p>Your basket is empty</p>
          <Link to="/" className="btn">Browse Products</Link>
        </div>
      ) : (
        <>
          <div className="basket-items">
            {basketItems.map(item => (
              <div className="basket-item" key={item.id}>
                <div className="item-image">
                  {item.products.image_url ? (
                    <img src={item.products.image_url} alt={item.products.name} />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                
                <div className="item-details">
                  <h3>{item.products.name}</h3>
                  <p className="farm-name">from {item.products.farms.name}</p>
                  <p className="item-price">${item.products.price.toFixed(2)} each</p>
                </div>
                
                <div className="quantity-controls">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    +
                  </button>
                </div>
                
                <div className="item-subtotal">
                  ${(item.products.price * item.quantity).toFixed(2)}
                </div>
                
                <button 
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <div className="basket-summary">
            <div className="total-section">
              <h3>Total</h3>
              <span className="total-price">${totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="basket-actions">
              <Link to="/" className="btn secondary">Continue Shopping</Link>
              <button 
                className="btn primary"
                onClick={proceedToCheckout}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Basket; 