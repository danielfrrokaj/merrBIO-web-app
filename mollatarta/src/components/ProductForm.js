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
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
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
          <select
            id="category_ids"
            name="category_ids"
            multiple
            value={formData.category_ids}
            onChange={handleCategoryChange}
            className="category-select"
          >
            {loadingCategories ? (
              <option disabled>Loading categories...</option>
            ) : (
              categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
          <p className="form-help">Hold Ctrl (or Cmd on Mac) to select multiple categories</p>
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