import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/OrderConfirmation.css';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();
        
        if (orderError) {
          if (orderError.code === 'PGRST116') {
            throw new Error('Order not found or you do not have permission to view it');
          }
          throw orderError;
        }
        
        setOrder(orderData);
        
        // Fetch order items with product details
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id, 
            quantity, 
            price_per_unit,
            products(id, name, farm_id),
            farms!products(name)
          `)
          .eq('order_id', orderId);
        
        if (itemsError) throw itemsError;
        
        setOrderItems(itemsData || []);
        
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError(error.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, navigate]);
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/account" className="btn">Go to Account</Link>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="not-found-container">
        <h2>Order Not Found</h2>
        <p>We couldn't find the order you're looking for.</p>
        <Link to="/account" className="btn">Go to Account</Link>
      </div>
    );
  }
  
  return (
    <div className="order-confirmation-container">
      <div className="confirmation-header">
        <h1>Order Confirmation</h1>
        <div className="order-status">
          <span className={`status-badge ${order.status}`}>{order.status}</span>
        </div>
      </div>
      
      <div className="confirmation-message">
        <h2>Thank you for your order!</h2>
        <p>Your order has been received and is now being processed.</p>
      </div>
      
      <div className="order-details">
        <div className="order-info">
          <h3>Order Information</h3>
          <p><strong>Order Number:</strong> #{order.id}</p>
          <p><strong>Date Placed:</strong> {formatDate(order.created_at)}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total:</strong> £{order.total_amount.toFixed(2)}</p>
        </div>
        
        <div className="shipping-info">
          <h3>Shipping Information</h3>
          <p><strong>Name:</strong> {order.customer_name}</p>
          <p><strong>Address:</strong> {order.shipping_address}</p>
          <p><strong>Email:</strong> {order.contact_email}</p>
          <p><strong>Phone:</strong> {order.contact_phone}</p>
        </div>
      </div>
      
      <div className="order-items">
        <h3>Order Items</h3>
        <div className="items-table">
          <div className="table-header">
            <div className="product-col">Product</div>
            <div className="farm-col">Farm</div>
            <div className="quantity-col">Quantity</div>
            <div className="price-col">Price</div>
            <div className="total-col">Total</div>
          </div>
          {orderItems.map(item => (
            <div key={item.id} className="table-row">
              <div className="product-col">{item.products.name}</div>
              <div className="farm-col">{item.farms.name}</div>
              <div className="quantity-col">{item.quantity}</div>
              <div className="price-col">£{item.price_per_unit.toFixed(2)}</div>
              <div className="total-col">£{(item.price_per_unit * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
        
        <div className="order-total">
          <div className="total-label">Order Total:</div>
          <div className="total-value">£{order.total_amount.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="confirmation-actions">
        <Link to="/products" className="btn">Continue Shopping</Link>
        <Link to="/account/orders" className="btn secondary">View All Orders</Link>
      </div>
    </div>
  );
};

export default OrderConfirmation; 