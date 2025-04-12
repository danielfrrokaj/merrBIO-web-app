import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/OrderProduct.css';

export default function OrderProduct() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [farm, setFarm] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch product and farm details
  useEffect(() => {
    async function fetchProductDetails() {
      try {
        setLoading(true);
        
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`*, farms(*)`)
          .eq('id', productId)
          .single();
          
        if (productError) throw productError;
        
        if (!productData) {
          navigate('/farms');
          return;
        }
        
        setProduct(productData);
        setFarm(productData.farms);
        
        // Redirect if product is unavailable
        if (!productData.available) {
          setError('This product is currently unavailable for order.');
        }
      } catch (error) {
        setError('Error fetching product: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProductDetails();
  }, [productId, navigate]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(value < 1 ? 1 : value);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/order/${productId}`));
      return;
    }
    
    if (!product || !product.available) {
      setError('This product is currently unavailable.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate total price
      const totalPrice = product.price * quantity;
      
      // Add additional validation
      if (!product.id || !farm?.id) {
        throw new Error('Product or farm information is missing');
      }
      
      // Insert order into database
      const { error } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          product_id: product.id,
          quantity: quantity,
          total_price: totalPrice,
          status: 'pending'
        }])
        .select();
        
      if (error) throw error;
      
      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/my-orders');
      }, 3000);
    } catch (error) {
      setError('Error placing order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (orderSuccess) {
    return (
      <div className="order-success">
        <div className="success-icon">✓</div>
        <h2>Order Placed Successfully!</h2>
        <p>Thank you for your order. You will be redirected to your orders page shortly.</p>
        <button onClick={() => navigate('/my-orders')} className="primary-button">
          View My Orders
        </button>
      </div>
    );
  }

  if (!product) {
    return <div className="error-message">Product not found</div>;
  }

  return (
    <div className="order-page">
      <button onClick={goBack} className="back-button">
        ← Back
      </button>
      
      <h1>Place an Order</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="order-container">
        <div className="product-info">
          <div className="product-image">
            <img 
              src={product?.image_url || 'https://images.unsplash.com/photo-1627484142233-50b739b53e4b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGZhcm0lMjBwcm9kdWN0c3xlbnwwfHwwfHx8MA%3D%3D'} 
              alt={product?.name || 'Product'}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1627484142233-50b739b53e4b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGZhcm0lMjBwcm9kdWN0c3xlbnwwfHwwfHx8MA%3D%3D';
              }}
            />
          </div>
          
          <div className="product-details">
            <h2>{product?.name || 'Product'}</h2>
            <p className="farm-name">From: {farm?.name || 'Unknown Farm'}</p>
            
            {product?.description && (
              <p className="product-description">{product.description}</p>
            )}
            
            <p className="product-price">
              <span className="price-label">Price:</span> ${product ? parseFloat(product.price).toFixed(2) : '0.00'}
            </p>
            
            {product && !product.available && (
              <p className="unavailable-message">
                This product is currently unavailable for order.
              </p>
            )}
          </div>
        </div>
        
        <div className="order-form">
          <div className="form-group">
            <label htmlFor="quantity">Quantity:</label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              disabled={!product.available || loading}
            />
          </div>
          
          <div className="order-summary">
            <p>
              <span>Subtotal:</span>
              <span>${(product.price * quantity).toFixed(2)}</span>
            </p>
          </div>
          
          <button 
            onClick={handlePlaceOrder}
            className="place-order-button"
            disabled={!product.available || loading}
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
          
          {!user && (
            <p className="login-message">
              Please <a href="/login">log in</a> to place an order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 