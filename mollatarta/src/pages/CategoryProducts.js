import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import '../styles/CategoryProducts.css';

export default function CategoryProducts() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the category details
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (categoryError) throw categoryError;
        setCategory(categoryData);

        // Fetch products in this category via the junction table
        const { data: productCategoriesData, error: pcError } = await supabase
          .from('product_categories')
          .select(`
            product:products(
              *,
              farm:farms(id, name, location)
            )
          `)
          .eq('category_id', categoryId);

        if (pcError) throw pcError;

        // Extract and filter the products
        const productsData = productCategoriesData
          .map(pc => pc.product)
          .filter(product => product && product.available);

        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching category products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryAndProducts();
    }
  }, [categoryId]);

  return (
    <div className="category-products-page">
      {loading ? (
        <div className="loading-spinner">{t('products.loading')}</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <header className="category-header">
            <Link to="/products" className="back-button">
              ← {t('products.back_to_categories')}
            </Link>
            <h1>{category?.name || t('products.category_products')}</h1>
            {category?.description && (
              <p className="category-description">{category.description}</p>
            )}
          </header>

          {products.length > 0 ? (
            <div className="products-grid">
              {products.map(product => (
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