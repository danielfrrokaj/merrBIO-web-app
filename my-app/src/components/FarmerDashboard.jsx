import { useState, useEffect } from 'react'
import { supabase } from '../config/supabaseClient'

export default function FarmerDashboard() {
  const [products, setProducts] = useState([])
  const [baskets, setBaskets] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState(null)

  // Form state
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productQuantity, setProductQuantity] = useState('')

  useEffect(() => {
    // Get user session
    const getUserSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUserId(data.session.user.id);
        fetchData(data.session.user.id);
        setupRealtime(data.session.user.id);
      } else {
        setLoading(false);
      }
    };

    getUserSession();
  }, [])

  const fetchData = async (currentUserId) => {
    setLoading(true)
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
        .eq('farmer_id', currentUserId)

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Fetch baskets
      const { data: basketsData, error: basketsError } = await supabase
        .from('baskets')
        .select('*')
        .eq('farmer_id', currentUserId)

      if (basketsError) throw basketsError
      setBaskets(basketsData || [])

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*, requests(*)')
        .eq('farmer_id', currentUserId)
        .order('created_at', { ascending: false })

      if (notificationsError) throw notificationsError
      setNotifications(notificationsData || [])

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (e) => {
    e.preventDefault()
    
    if (!productName || !productPrice || !productQuantity) {
      setError('Please fill in all required fields')
      return
    }

    if (!userId) {
      setError('You must be logged in to create products')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
      .from('products')
        .insert([{ 
          name: productName,
          description: productDescription,
          price: parseFloat(productPrice),
          quantity: parseInt(productQuantity),
          farmer_id: userId
        }])

      if (error) throw error
      
      // Reset form
      setProductName('')
      setProductDescription('')
      setProductPrice('')
      setProductQuantity('')
      setShowProductForm(false)
      
      // Refresh products
      fetchData(userId)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtime = (currentUserId) => {
    const channel = supabase.channel('farmer-notifications')
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `farmer_id=eq.${currentUserId}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const markNotificationAsRead = async (id) => {
    await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('id', id)

    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read_status: true } 
          : notification
      )
    )
  }

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Farmer Dashboard</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Product Management Section */}
      <section>
        <div className="section-header">
          <h2>Products</h2>
          <button 
            className="card-button"
            onClick={() => setShowProductForm(!showProductForm)}
          >
            {showProductForm ? 'Cancel' : 'Add New Product'}
          </button>
        </div>
        
        {showProductForm && (
          <form onSubmit={createProduct} className="form-container">
            <div className="form-field">
              <label>Product Name*</label>
              <input 
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-field">
              <label>Description</label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows="3"
              />
            </div>
            
            <div className="form-grid">
              <div className="form-field">
                <label>Price*</label>
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-field">
                <label>Quantity*</label>
                <input 
                  type="number"
                  min="1"
                  step="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </form>
        )}
        
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="card-grid">
            {products.length > 0 ? (
              products.map(product => (
                <div key={product.id} className="card">
                  <div className="card-content">
                    <h3 className="card-title">{product.name}</h3>
                    <p>{product.description}</p>
                    <p className="card-price">${product.price}</p>
                    <p>Quantity: {product.quantity}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No products yet. Create your first product!</p>
            )}
          </div>
        )}
      </section>
      
      {/* Baskets Section */}
      <section className="mt-5">
        <h2>Baskets</h2>
        <button className="card-button">Create New Basket</button>
        
        <div className="card-grid">
          {baskets.length > 0 ? (
            baskets.map(basket => (
              <div key={basket.id} className="card">
                <div className="card-content">
                  <h3 className="card-title">{basket.name}</h3>
                  <p>{basket.description}</p>
                  <p className="card-price">${basket.price}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No baskets created yet.</p>
          )}
        </div>
      </section>
      
      {/* Notifications Section */}
      <section className="mt-5">
        <h2>Notifications</h2>
        
        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read_status ? 'unread' : ''}`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <p>New request for your product!</p>
                <small>{new Date(notification.created_at).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No notifications yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}