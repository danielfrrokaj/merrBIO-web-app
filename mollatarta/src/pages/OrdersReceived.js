import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../styles/MyOrders.css'; // Reuse the same styling

export default function OrdersReceived() {
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchReceivedOrders() {
      try {
        setLoading(true);
        
        // First get all farms owned by this farmer
        const { data: farms, error: farmsError } = await supabase
          .from('farms')
          .select('id')
          .eq('owner_id', user.id);
          
        if (farmsError) throw farmsError;
        
        if (!farms || farms.length === 0) {
          setReceivedOrders([]);
          setLoading(false);
          return;
        }
        
        const farmIds = farms.map(farm => farm.id);
        
        // Then get all products from these farms
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, farm_id')
          .in('farm_id', farmIds);
          
        if (productsError) throw productsError;
        
        if (!products || products.length === 0) {
          setReceivedOrders([]);
          setLoading(false);
          return;
        }
        
        const productIds = products.map(product => product.id);
        
        // Finally get all orders for these products
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id, 
            user_id,
            quantity, 
            total_price, 
            status, 
            created_at,
            products(id, name, image_url, farm_id, farms(id, name)),
            profiles:user_id(id, full_name)
          `)
          .in('product_id', productIds)
          .order('created_at', { ascending: false });
          
        if (ordersError) throw ordersError;
        setReceivedOrders(orders || []);
      } catch (error) {
        setError('Error fetching orders: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReceivedOrders();
  }, [user.id]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Update local state after successful update
      setReceivedOrders(receivedOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      setError('Error updating order: ' + error.message);
    }
  };

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
    return <div className="loading-spinner">Loading received orders...</div>;
  }

  return (
    <div className="my-orders-page">
      <header className="orders-header">
        <h1>Orders Received</h1>
        <button onClick={goToDashboard} className="dashboard-button">
          Dashboard
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {receivedOrders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't received any orders yet.</p>
          <button onClick={goToDashboard} className="primary-button">
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {receivedOrders.map(order => {
            // Add null checks for products
            const productName = order.products?.name || 'Product';
            const productImageUrl = order.products?.image_url;
            const farmName = order.products?.farms?.name || 'Unknown Farm';
            const customerName = order.profiles?.full_name || 'Customer';
            
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
                  
                  <p className="order-customer">
                    Customer: {customerName}
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
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="confirm-button"
                    >
                      Confirm Order
                    </button>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="ship-button"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  
                  {order.status === 'shipped' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="deliver-button"
                    >
                      Mark as Delivered
                    </button>
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