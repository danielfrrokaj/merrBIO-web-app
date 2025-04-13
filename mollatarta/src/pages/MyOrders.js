import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import '../styles/MyOrders.css';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

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
        return <span className="status-pending">{t('status.pending')}</span>;
      case 'confirmed':
        return <span className="status-confirmed">{t('status.confirmed')}</span>;
      case 'shipped':
        return <span className="status-shipped">{t('status.shipped')}</span>;
      case 'delivered':
        return <span className="status-delivered">{t('status.delivered')}</span>;
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

  // Format order ID to be more readable
  const formatOrderId = (id) => {
    // Extract the first 8 characters of the UUID
    if (id && id.length > 8) {
      return `#${id.substring(0, 8).toUpperCase()}`;
    }
    return `#${id}`;
  };

  if (loading) {
    return <div className="loading-spinner">{t('common.loading')}</div>;
  }

  return (
    <div className="my-orders-page">
      <header className="orders-header">
        <h1>{t('orders.your_orders')}</h1>
        <button onClick={goToDashboard} className="dashboard-button">
          {t('orders.dashboard')}
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>{t('orders.no_orders')}</p>
          <Link to="/farms" className="primary-button">
            {t('orders.browse_farms')}
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const productName = order.products?.name || 'Product';
            const productImageUrl = order.products?.image_url;
            const farmName = order.products?.farms?.name || t('messages.unknown_farm');
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
                  
                  <p className="order-number">
                    {t('orders.order_number', 'Order')}: {formatOrderId(order.id)}
                  </p>
                  
                  <p className="order-farm">
                    {t('products.from')}: {farmName}
                  </p>
                  
                  <div className="order-info">
                    <p>
                      <span className="info-label">{t('orders.quantity')}:</span> {order.quantity}
                    </p>
                    <p>
                      <span className="info-label">{t('orders.total')}:</span> ${parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <p>
                      <span className="info-label">{t('orders.date')}:</span> {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="order-actions">
                  {farmId ? (
                    <Link 
                      to={location.pathname === '/my-orders' ? 
                        `/profile?tab=messages&farmId=${farmId}&action=new&orderId=${order.id}&productName=${encodeURIComponent(productName)}&orderNumber=${encodeURIComponent(formatOrderId(order.id))}` 
                        : 
                        `/farms/${farmId}`
                      } 
                      className={location.pathname === '/my-orders' ? 'contact-farmer-button' : 'view-farm-button'}
                    >
                      {location.pathname === '/my-orders' ? t('farms.contact_farmer') : t('orders.view_farm')}
                    </Link>
                  ) : (
                    <span className="unavailable-button">
                      {t('messages.unknown_farm')}
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