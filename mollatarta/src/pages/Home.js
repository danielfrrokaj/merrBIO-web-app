import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaLeaf } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import '../styles/Home.css';

// Mock data for development when Supabase is not configured
const MOCK_FARMS = [
  {
    id: '1',
    name: 'Green Valley Farm',
    location: 'Springfield, IL',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 2
  },
  {
    id: '2',
    name: 'Sunrise Organic',
    location: 'Riverdale, CA',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 2
  },
  {
    id: '3',
    name: 'Happy Harvest',
    location: 'Boulder, CO',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 2
  },
  {
    id: '4',
    name: 'Sunshine Acres',
    location: 'Portland, OR',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 2
  }
];

const FALLBACK_CATEGORIES = [
  {
    id: '1',
    name: 'Vegetables',
    description: 'Fresh, locally grown vegetables',
    image_url: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 0
  },
  {
    id: '2',
    name: 'Fruits',
    description: 'Sweet and nutritious fruits',
    image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 0
  },
  {
    id: '3',
    name: 'Dairy',
    description: 'Milk, cheese, and other dairy products',
    image_url: 'https://images.unsplash.com/photo-1628088062854-d1870b1b7181?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 0
  },
  {
    id: '4',
    name: 'Meat',
    description: 'Ethically raised meat products',
    image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 0
  }
];

const Home = () => {
  const [farms, setFarms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [usesMockData, setUsesMockData] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Add full-width class to body
    document.body.classList.add('full-width-body');
    
    // Remove the class when component unmounts
    return () => {
      document.body.classList.remove('full-width-body');
    };
  }, []);

  useEffect(() => {
    // Fetch featured farms
    const fetchFarms = async () => {
      try {
        setLoadingFarms(true);
        
        // Check if Supabase is properly configured
        if (!supabase || !process.env.REACT_APP_SUPABASE_URL) {
          console.warn('Using mock farm data - Supabase not configured');
          setFarms(MOCK_FARMS);
          setUsesMockData(true);
          return;
        }
        
        const { data, error } = await supabase
          .from('farms')
          .select(`
            *,
            products:products(id)
          `)
          .limit(4);

        if (error) throw error;
        
        // Process data to add products count
        const processedData = data?.map(farm => ({
          ...farm,
          product_count: farm.products?.length || 0
        })) || [];
        
        setFarms(processedData);
      } catch (err) {
        console.error('Error fetching farms:', err);
        setFarms(MOCK_FARMS);
        setUsesMockData(true);
      } finally {
        setLoadingFarms(false);
      }
    };

    // Fetch categories with products count
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        
        // Check if Supabase is properly configured
        if (!supabase || !process.env.REACT_APP_SUPABASE_URL) {
          console.warn('Using fallback category data - Supabase not configured');
          setCategories(FALLBACK_CATEGORIES);
          setUsesMockData(true);
          return;
        }
        
        // First check if categories table exists
        const { error: tableCheckError } = await supabase
          .from('categories')
          .select('id')
          .limit(1);
          
        if (tableCheckError) {
          console.warn('Categories table not found, using fallback data');
          setCategories(FALLBACK_CATEGORIES);
          setUsesMockData(true);
          return;
        }
        
        // Fetch categories with a count of products
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select(`
            *,
            product_categories:product_categories(
              product:products(*)
            )
          `);
          
        if (categoriesError) throw categoriesError;
        
        // Process the data to add product counts and product lists
        const processedCategories = categoriesData.map(category => {
          const productsInCategory = category.product_categories
            ?.filter(pc => pc.product)
            .map(pc => pc.product) || [];
            
          return {
            ...category,
            products: productsInCategory,
            product_count: productsInCategory.length
          };
        });
        
        // Sort categories by number of products (descending)
        processedCategories.sort((a, b) => b.product_count - a.product_count);
        
        // If we got categories but they're empty, use fallback
        if (processedCategories.length === 0) {
          setCategories(FALLBACK_CATEGORIES);
        } else {
          setCategories(processedCategories.slice(0, 4)); // Limit to 4 categories for display
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories(FALLBACK_CATEGORIES);
        setUsesMockData(true);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchFarms();
    fetchCategories();
  }, []);

  return (
    <div className="home-container" style={{ width: '100%', overflow: 'hidden', margin: 0, padding: 0 }}>
      {/* Hero Section with Image Background */}
      <div className="hero-section" style={{ width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }}>
        <div className="image-container">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGZhcm18ZW58MHx8MHx8fDA%3D"
            alt="Farm landscape"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>{t('home.hero_title')}</h1>
            <p>{t('home.hero_subtitle')}</p>
            <div className="hero-cta">
              <Link to="/farms" className="primary-button">{t('farms.browse')}</Link>
              <Link to="/signup" className="secondary-button">{t('nav.signup')}</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="home-page">
        {/* Display error message if any */}
        {error && <div className="error-message">{error}</div>}

        {/* Featured Farms Section */}
        <section className="farms-section">
          <div className="section-header">
            <h2>{t('home.featured_farms')}</h2>
            <Link to="/farms" className="view-all-link">{t('home.view_all')}</Link>
          </div>
          
          {loadingFarms ? (
            <div className="loading-spinner">{t('home.loading_farms')}</div>
          ) : (
            <div className="farms-grid">
              {farms.length > 0 ? (
                farms.map((farm) => (
                  <div key={farm.id} className="farm-card public">
                    <div className="farm-image">
                      <img 
                        src={farm.image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGZhcm18ZW58MHx8MHx8fDA%3D'} 
                        alt={farm.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGZhcm18ZW58MHx8MHx8fDA%3D';
                        }}
                      />
                    </div>
                    
                    <div className="farm-content">
                      <h3 className="farm-name">{farm.name}</h3>
                      
                      {farm.location && (
                        <p className="farm-location">
                          <FaMapMarkerAlt className="icon" />
                          <span>{farm.location || 'Location unavailable'}</span>
                        </p>
                      )}
                      
                      <div className="product-count">
                        <FaLeaf className="icon" /> {farm.product_count || '0'} {t('farms.products_available')}
                      </div>
                    </div>
                    
                    <div className="farm-actions">
                      <Link to={`/farms/${farm.id}`} className="view-farm-button">
                        {t('farms.view_products')}
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p>{t('home.no_farms')}</p>
              )}
            </div>
          )}
        </section>

        {/* Categories Section */}
        <section className="categories-section">
          <div className="section-header">
            <h2>{t('home.browse_categories')}</h2>
            <Link to="/products" className="view-all-link">{t('home.view_all_products')}</Link>
          </div>
          
          {loadingCategories ? (
            <div className="loading-spinner">{t('home.loading_categories')}</div>
          ) : (
            <div className="categories-grid">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <div key={category.id} className="category-card">
                    <div className="category-image">
                      <img
                        src={category.image_url || 'https://via.placeholder.com/300x200?text=Category'}
                        alt={category.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x200?text=Category';
                        }}
                      />
                    </div>
                    <h3>{category.name}</h3>
                    <p className="category-count">{category.product_count} {t('farms.products_available')}</p>
                    <Link to={`/categories/${category.id}`} className="category-link">
                      {t('farms.view_products')}
                    </Link>
                  </div>
                ))
              ) : (
                <p>{t('home.no_categories')}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home; 