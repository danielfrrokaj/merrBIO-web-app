import { useEffect, useState } from 'react'
import { supabase } from '../config/supabaseClient'

export default function ConsumerMarket() {
  const [products, setProducts] = useState([])
  const [baskets, setBaskets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchMarketData()
  }, [])

  const fetchMarketData = async () => {
    try {
      setLoading(true)
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .gt('quantity', 0) // Only show products with stock
      
      if (productsError) throw productsError
      setProducts(productsData || [])

      // Fetch baskets
      const { data: basketsData, error: basketsError } = await supabase
        .from('baskets')
        .select(`
          *,
          basket_products ( 
            product_id, 
            quantity,
            products (*)
          )
        `)
      
      if (basketsError) throw basketsError
      setBaskets(basketsData || [])

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createRequest = async (item, isBasket) => {
    try {
      setError(null)
      setSuccessMsg('')
      
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        setError('Please log in to make a request')
        return
      }
      
      const userId = sessionData.session.user.id

      const request = {
        consumer_id: userId,
        [isBasket ? 'basket_id' : 'product_id']: item.id,
        quantity: 1,
        status: 'pending'
      }
      
      const { data, error: requestError } = await supabase
        .from('requests')
        .insert([request])
        .select()

      if (requestError) throw requestError

      if (data && data.length > 0) {
        // Create notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert([{ 
            farmer_id: item.farmer_id, 
            request_id: data[0].id,
            read_status: false
          }])

        if (notificationError) throw notificationError
        
        setSuccessMsg('Request sent successfully!')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="market-container">
      <h1 className="page-title">Farmer's Market</h1>
      
      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}
      
      {loading ? (
        <p>Loading market items...</p>
      ) : (
        <>
          {/* Products Section */}
          <section>
            <h2>Available Products</h2>
            
            <div className="card-grid">
              {products.length > 0 ? (
                products.map(product => (
                  <div key={product.id} className="card">
                    <div className="card-content">
                      <h3 className="card-title">{product.name}</h3>
                      <p>{product.description}</p>
                      <p className="card-price">${product.price}</p>
                      <p>Available: {product.quantity}</p>
                      <button 
                        className="card-button"
                        onClick={() => createRequest(product, false)}
                      >
                        Request Product
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No products available at the moment.</p>
              )}
            </div>
          </section>
          
          {/* Baskets Section */}
          <section className="mt-5">
            <h2>Available Baskets</h2>
            
            <div className="card-grid">
              {baskets.length > 0 ? (
                baskets.map(basket => (
                  <div key={basket.id} className="card">
                    <div className="card-content">
                      <h3 className="card-title">{basket.name}</h3>
                      <p>{basket.description}</p>
                      <p className="card-price">${basket.price}</p>
                      
                      {basket.basket_products && basket.basket_products.length > 0 && (
                        <div className="basket-contents">
                          <p><strong>Contains:</strong></p>
                          <ul>
                            {basket.basket_products.map((item, index) => (
                              <li key={index}>
                                {item.products?.name} (x{item.quantity})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <button 
                        className="card-button"
                        onClick={() => createRequest(basket, true)}
                      >
                        Request Basket
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No baskets available at the moment.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}