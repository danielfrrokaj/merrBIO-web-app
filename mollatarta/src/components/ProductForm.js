import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/ProductForm.css';

export default function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    available: true,
    image_url: '',
    category_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch available categories
  useEffect(() => {
    async function fetchCategories() {
      setLoadingCategories(true);
      setError('');
      try {
        console.log('Fetching categories...');
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
          
        if (error) {
          console.error('Error fetching categories:', error);
          throw error;
        }
        
        console.log('Categories fetched successfully:', data);
        setCategories(data || []);
        
        if (!data || data.length === 0) {
          console.warn('No categories found in the database.');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Could not load categories. ' + err.message);
      } finally {
        setLoadingCategories(false);
      }
    }
    
    fetchCategories();
  }, []);
  
  // If editing, populate the form with existing data and fetch product categories
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price ? String(product.price) : '',
        available: product.available !== undefined ? product.available : true,
        image_url: product.image_url || '',
        category_ids: []
      });
      
      // If editing, fetch the product's current categories
      async function fetchProductCategories() {
        try {
          const { data, error } = await supabase
            .from('product_categories')
            .select('category_id')
            .eq('product_id', product.id);
            
          if (error) throw error;
          
          const categoryIds = data.map(item => item.category_id);
          setFormData(prev => ({
            ...prev,
            category_ids: categoryIds
          }));
        } catch (err) {
          console.error('Error fetching product categories:', err);
        }
      }
      
      fetchProductCategories();
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({
      ...formData,
      category_ids: selectedOptions
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (!formData.price.trim() || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price)
    };
    
    // Remove category_ids from productData as it will be handled separately
    const { category_ids, ...productPayload } = productData;
    
    setLoading(true);
    try {
      const savedProduct = await onSave(productPayload);
      
      // If we have a product ID and categories, update the product categories
      if (savedProduct && savedProduct.id && category_ids.length > 0) {
        // First delete existing category assignments
        await supabase
          .from('product_categories')
          .delete()
          .eq('product_id', savedProduct.id);
          
        // Then insert new category assignments
        const categoryAssignments = category_ids.map(categoryId => ({
          product_id: savedProduct.id,
          category_id: categoryId
        }));
        
        const { error: categoryError } = await supabase
          .from('product_categories')
          .insert(categoryAssignments);
          
        if (categoryError) throw categoryError;
      }
    } catch (error) {
      setError('Failed to save product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form">
      <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
      
      {error && <div className="form-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Product Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter product name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Describe your product"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="price">Price ($) *</label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.price}
            onChange={handleChange}
            required
            placeholder="0.00"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="image_url">Image URL</label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="Enter image URL"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category_ids">Categories</label>
          <div className="category-checkboxes">
            {loadingCategories ? (
              <p>Loading categories...</p>
            ) : categories.length === 0 ? (
              <div className="no-categories">
                <p>No categories found. Click the button below to set up categories.</p>
                <button 
                  type="button" 
                  className="setup-categories-button"
                  onClick={async () => {
                    try {
                      setLoadingCategories(true);
                      setError('');
                      
                      // Import dynamically to avoid circular dependencies
                      const { setupCategoriesAndProducts } = await import('../utils/setupCategoriesAndProducts');
                      
                      // Run the setup
                      const result = await setupCategoriesAndProducts();
                      
                      if (result.success) {
                        // Fetch categories again after setup
                        const { data, error } = await supabase
                          .from('categories')
                          .select('*')
                          .order('name');
                          
                        if (error) throw error;
                        setCategories(data || []);
                        
                        // Show success message
                        setError('');
                      } else {
                        // Show the SQL that needs to be run to fix the issue
                        throw new Error(result.message);
                      }
                    } catch (err) {
                      console.error('Error setting up categories:', err);
                      setError(err.message);
                    } finally {
                      setLoadingCategories(false);
                    }
                  }}
                >
                  Set Up Categories
                </button>
              </div>
            ) : (
              categories.map(category => (
                <div key={category.id} className="category-checkbox">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    name="category_ids"
                    value={category.id}
                    checked={formData.category_ids.includes(category.id)}
                    onChange={(e) => {
                      const categoryId = e.target.value;
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          category_ids: [...formData.category_ids, categoryId]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          category_ids: formData.category_ids.filter(id => id !== categoryId)
                        });
                      }
                    }}
                  />
                  <label htmlFor={`category-${category.id}`}>{category.name}</label>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="form-checkbox">
          <input
            id="available"
            name="available"
            type="checkbox"
            checked={formData.available}
            onChange={handleChange}
          />
          <label htmlFor="available">Product is available for order</label>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
} 