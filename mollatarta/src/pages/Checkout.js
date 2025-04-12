import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [basketItems, setBasketItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    phone: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Get current user and basket items
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          fetchBasketItems(user.id);
        } else {
          navigate('/login?redirect=checkout');
        }
      } catch (error) {
        console.error('Error getting user:', error);
        setError('Failed to authenticate user. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [navigate]);

  const fetchBasketItems = async (userId) => {
    try {
      setLoading(true);
      
      // Fetch basket items with product details
      const { data, error } = await supabase
        .from('basket_items')
        .select(`
          id,
          product_id,
          quantity,
          products(id, name, price, farm_id),
          farms!products(name)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (data) {
        setBasketItems(data);
        
        // Calculate total price
        const total = data.reduce((sum, item) => {
          return sum + (item.products.price * item.quantity);
        }, 0);
        
        setTotalPrice(total);
        
        // Pre-fill email if available
        if (user && user.email) {
          setFormData(prev => ({ ...prev, email: user.email }));
        }
      }
    } catch (error) {
      console.error('Error fetching basket:', error);
      setError('Failed to load your basket items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.postcode.trim()) errors.postcode = 'Postcode is required';
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9\s+\-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalPrice,
          status: 'pending',
          shipping_address: `${formData.address}, ${formData.city}, ${formData.postcode}`,
          contact_phone: formData.phone,
          contact_email: formData.email,
          customer_name: `${formData.firstName} ${formData.lastName}`
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = basketItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_per_unit: item.products.price
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Clear basket
      const { error: clearError } = await supabase
        .from('basket_items')
        .delete()
        .eq('user_id', user.id);
      
      if (clearError) throw clearError;
      
      // Set order complete
      setOrderComplete(true);
      
      // Redirect to confirmation page after a brief delay
      setTimeout(() => {
        navigate(`/order-confirmation/${order.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error processing order:', error);
      setError('Failed to process your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading checkout information...</div>;
  }
  
  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <Link to="/basket" className="btn">Return to Basket</Link>
      </div>
    );
  }
  
  if (basketItems.length === 0 && !orderComplete) {
    return (
      <div className="empty-basket">
        <p>Your basket is empty. Add some products before checkout.</p>
        <Link to="/products" className="btn">Browse Products</Link>
      </div>
    );
  }
  
  if (orderComplete) {
    return (
      <div className="checkout-container">
        <div className="order-complete">
          <h2>Thank you for your order!</h2>
          <p>Your order has been received and is being processed.</p>
          <p>You will be redirected to the confirmation page shortly...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      <div className="checkout-grid">
        <div className="checkout-form-container">
          <h2>Shipping Information</h2>
          
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name*</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={formErrors.firstName ? 'error-input' : ''}
                />
                {formErrors.firstName && <p className="error-message">{formErrors.firstName}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name*</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={formErrors.lastName ? 'error-input' : ''}
                />
                {formErrors.lastName && <p className="error-message">{formErrors.lastName}</p>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={formErrors.email ? 'error-input' : ''}
              />
              {formErrors.email && <p className="error-message">{formErrors.email}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address*</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={formErrors.address ? 'error-input' : ''}
              />
              {formErrors.address && <p className="error-message">{formErrors.address}</p>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City*</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={formErrors.city ? 'error-input' : ''}
                />
                {formErrors.city && <p className="error-message">{formErrors.city}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="postcode">Postcode*</label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  className={formErrors.postcode ? 'error-input' : ''}
                />
                {formErrors.postcode && <p className="error-message">{formErrors.postcode}</p>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number*</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={formErrors.phone ? 'error-input' : ''}
              />
              {formErrors.phone && <p className="error-message">{formErrors.phone}</p>}
            </div>
            
            <div className="checkout-actions">
              <Link to="/basket" className="btn secondary">Return to Basket</Link>
              <button 
                type="submit" 
                className="btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="order-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-items">
            {basketItems.map(item => (
              <div key={item.id} className="summary-item">
                <div className="summary-item-details">
                  <h4>{item.products.name}</h4>
                  <p className="farm-name">Farm: {item.farms.name}</p>
                  <p>Quantity: {item.quantity}</p>
                </div>
                <div className="summary-item-price">
                  £{(item.products.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="summary-total">
            <h3>Total</h3>
            <div className="total-price">£{totalPrice.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 