import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import '../styles/AllProducts.css';

export default function AllProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { t } = useTranslation();

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch all products with their farm and category information
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            farm:farms(id, name, location),
            product_categories:product_categories(
              category:categories(id, name)
            )
          `)
          .eq('available', true)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // Process products to include their categories
        const processedProducts = productsData.map(product => ({
          ...product,
          categories: product.product_categories ? 
            product.product_categories.filter(pc => pc && pc.category).map(pc => pc.category) :
            []
        }));

        setProducts(processedProducts);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => 
        product.categories.some(category => category.id === selectedCategory)
      );

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <div className="all-products-page">
      <header className="products-header">
        <h1>{t('products.all_products')}</h1>
        <div className="category-filter">
          <label htmlFor="category-select">{t('products.filter_by_category')}:</label>
          <select 
            id="category-select" 
            value={selectedCategory} 
            onChange={handleCategoryChange}
            className="category-select-dropdown"
          >
            <option value="all">{t('products.all_categories')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="loading-spinner">{t('products.loading')}</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isOwner={false}
                  onOrder={() => window.location.href = `/order/${product.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="no-products-message">
              <p>{t('products.no_products_found')}</p>
              <Link to="/farms" className="primary-button">
                {t('products.browse_farms')}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
} 