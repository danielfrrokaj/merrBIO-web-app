import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/MyOrders.css';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            quantity, 
            total_price, 
            status, 
            created_at,
            products(id, name, image_url, farm_id, farms(name))
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        setError('Error fetching orders: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user.id]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-pending">Pending</span>;
      case 'confirmed':
        return <span className="status-confirmed">Confirmed</span>;
      case 'shipped':
        return <span className="status-shipped">Shipped</span>;
      case 'delivered':
        return <span className="status-delivered">Delivered</span>;
      default:
        return <span className="status-pending">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div className="loading-spinner">Loading your orders...</div>;
  }

  return (
    <div className="my-orders-page">
      <header className="orders-header">
        <h1>My Orders</h1>
        <button onClick={goToDashboard} className="dashboard-button">
          Dashboard
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
          <Link to="/farms" className="primary-button">
            Browse Farms
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const productName = order.products?.name || 'Product';
            const productImageUrl = order.products?.image_url;
            const farmName = order.products?.farms?.name || 'Unknown Farm';
            const farmId = order.products?.farm_id;
            
            return (
              <div key={order.id} className="order-card">
                <div className="order-image">
                  <img 
                    src={productImageUrl || 'https://images.unsplash.com/photo-1627484142233-50b739b53e4b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGZhcm0lMjBwcm9kdWN0c3xlbnwwfHwwfHx8MA%3D%3D'} 
                    alt={productName}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1627484142233-50b739b53e4b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGZhcm0lMjBwcm9kdWN0c3xlbnwwfHwwfHx8MA%3D%3D';
                    }}
                  />
                </div>
                
                <div className="order-details">
                  <div className="order-header">
                    <h3>{productName}</h3>
                    {getStatusLabel(order.status)}
                  </div>
                  
                  <p className="order-farm">
                    From: {farmName}
                  </p>
                  
                  <div className="order-info">
                    <p>
                      <span className="info-label">Quantity:</span> {order.quantity}
                    </p>
                    <p>
                      <span className="info-label">Total:</span> ${parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <p>
                      <span className="info-label">Date:</span> {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="order-actions">
                  {farmId ? (
                    <Link to={`/farms/${farmId}`} className="view-farm-button">
                      View Farm
                    </Link>
                  ) : (
                    <span className="unavailable-button">
                      Farm Unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 