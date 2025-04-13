import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaLeaf } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import '../styles/Home.css';
import FavoriteButton from '../components/FavoriteButton';

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
  },
  {
    id: '5',
    name: 'Eggs',
    description: 'Farm fresh eggs',
    image_url: 'https://images.unsplash.com/photo-1598965675045-45c5e72c7d05?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    product_count: 0
  },
  {
    id: '6',
    name: 'Honey',
    description: 'Local honey and bee products',
    image_url: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Add full-width class to body
    document.body.classList.add('full-width-body');
    
    // Add scroll listener for fade effect
    const handleScroll = () => {
      const heroContent = document.querySelector('.hero-content');
      if (heroContent) {
        // Calculate opacity based on scroll position
        // Content should completely fade out by the time we've scrolled 60% of viewport height
        const scrollY = window.scrollY;
        const fadeStart = 0;
        const fadeEnd = window.innerHeight * 0.6;
        const opacity = 1 - Math.min(1, Math.max(0, (scrollY - fadeStart) / (fadeEnd - fadeStart)));
        
        // Apply opacity
        heroContent.style.opacity = opacity;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Remove the class and event listener when component unmounts
    return () => {
      document.body.classList.remove('full-width-body');
      window.removeEventListener('scroll', handleScroll);
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
          .limit(3);

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
          setCategories(processedCategories.slice(0, 6)); // Limit to 6 categories for display
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

  // Handle search functionality
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Search for farms by name or location
      const { data: farmResults, error: farmError } = await supabase
        .from('farms')
        .select('*, products:products(id)')
        .or(`name.ilike.%${query}%,location.ilike.%${query}%`);
        
      if (farmError) throw farmError;
      
      // Process farm results to add product count
      const processedFarms = farmResults?.map(farm => ({
        ...farm,
        product_count: farm.products?.length || 0,
        type: 'farm'
      })) || [];
      
      // Search for products by name or description
      const { data: productResults, error: productError } = await supabase
        .from('products')
        .select('*, farm:farms(id, name, location)')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
        
      if (productError) throw productError;
      
      // Process product results to add type
      const processedProducts = productResults?.map(product => ({
        ...product,
        type: 'product'
      })) || [];
      
      // Combine and set search results
      const combinedResults = {
        farms: processedFarms,
        products: processedProducts,
        totalCount: processedFarms.length + processedProducts.length
      };
      
      setSearchResults(combinedResults);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle input change with debouncing
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear any existing timer
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    // Set a new timer to run the search after 300ms of user stopping typing
    const newTimer = setTimeout(() => {
      handleSearch(value);
    }, 300);
    
    setSearchTimer(newTimer);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  return (
    <div className="home-container">
      {/* Hero Section as Full Screen Background */}
      <div className="hero-background">
        <div className="image-container">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGZhcm18ZW58MHx8MHx8fDA%3D"
            alt="Farm landscape"
          />
        </div>
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>{t('home.hero_title')}</h1>
            <p>{t('home.hero_subtitle')}</p>
            <div className="hero-cta">
              <button 
                onClick={() => {
                  const searchSection = document.getElementById('search-section');
                  searchSection.scrollIntoView({ behavior: 'smooth' });
                  // Add a small delay to focus the input after scroll completes
                  setTimeout(() => {
                    const searchInput = searchSection.querySelector('.search-input');
                    if (searchInput) searchInput.focus();
                  }, 800);
                }}
                className="hero-button"
              >
                {t('home.discover_fresh_local_food')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="home-content">
        {/* Display error message if any */}
        {error && <div className="error-message">{error}</div>}

        {/* About Us Section */}
        <section className="about-section" id="about-section">
          <div className="about-container">
            <h2 className="section-title">{t('home.about_title')}</h2>
            <div className="about-content">
              <div className="about-text">
                <p>{t('home.about_welcome')}</p>
                <p>{t('home.about_mission')}</p>
                <p>{t('home.about_benefits')}</p>
                <Link 
                  to="/farms"
                  className="hero-button"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  {t('home.explore_marketplace')}
                </Link>
              </div>
              <div className="about-image">
                <img 
                  src="https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
                  alt={t('home.farmer_image_alt')} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar Section */}
        <section className="search-section" id="search-section">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>{t('home.search_title')}</h2>
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder={t('home.search_placeholder')}
              className="search-input"
            />
            {isSearching && <span className="searching-indicator">{t('home.searching')}</span>}
          </div>
          
          {/* Search Results */}
          {isSearching ? (
            <div className="loading-spinner">{t('home.searching')}</div>
          ) : searchResults && (
            <div className="search-results">
              <h3 className="results-header">
                {searchResults.totalCount > 0 
                  ? `${searchResults.totalCount} ${t('home.results_found')}` 
                  : t('home.no_results')}
              </h3>
              
              {/* Farm Results */}
              {searchResults.farms.length > 0 && (
                <div className="farm-results">
                  <h4>{t('home.farms_header')}</h4>
                  <div className="farms-grid">
                    {searchResults.farms.map((farm) => (
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
                          
                          {/* Add favorite button */}
                          <div className="favorite-button-container">
                            <FavoriteButton 
                              type="farm" 
                              id={farm.id} 
                              size="medium"
                            />
                          </div>
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
                    ))}
                  </div>
                </div>
              )}
              
              {/* Product Results */}
              {searchResults.products.length > 0 && (
                <div className="product-results">
                  <h4>{t('home.products_header')}</h4>
                  <div className="products-grid">
                    {searchResults.products.map((product) => (
                      <div key={product.id} className="product-card">
                        <div className="product-image">
                          <img 
                            src={product.image_url || 'https://via.placeholder.com/300x200?text=Product'}
                            alt={product.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300x200?text=Product';
                            }}
                          />
                          
                          {/* Add favorite button */}
                          <div className="favorite-button-container">
                            <FavoriteButton 
                              type="product" 
                              id={product.id} 
                              size="medium"
                            />
                          </div>
                        </div>
                        
                        <div className="product-content">
                          <h3 className="product-name">{product.name}</h3>
                          <p className="product-price">${product.price.toFixed(2)}</p>
                          <p className="product-farm">
                            {t('home.from')}: {product.farm?.name || t('home.unknown_farm')}
                          </p>
                        </div>
                        
                        <div className="product-actions">
                          <Link to={`/order/${product.id}`} className="order-button">
                            {t('home.view_details')}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

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
                      
                      {/* Add favorite button */}
                      <div className="favorite-button-container">
                        <FavoriteButton 
                          type="farm" 
                          id={farm.id} 
                          size="medium"
                        />
                      </div>
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
                    <h3>
                      {t(`categories.${category.name.toLowerCase()}`, {defaultValue: category.name})}
                    </h3>
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