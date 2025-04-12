import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import '../styles/FarmProducts.css';

export default function FarmProducts() {
  const { farmId } = useParams();
  const [farm, setFarm] = useState(null);
  const [products, setProducts] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch farm and its products
  useEffect(() => {
    async function fetchFarmAndProducts() {
      try {
        setLoading(true);
        
        // Fetch farm details
        const { data: farmData, error: farmError } = await supabase
          .from('farms')
          .select('*')
          .eq('id', farmId)
          .single();
          
        if (farmError) throw farmError;
        
        if (!farmData) {
          navigate('/farms');
          return;
        }
        
        setFarm(farmData);
        
        // Check if current user is the farm owner
        setIsOwner(user && farmData.owner_id === user.id);
        
        // Fetch farm products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('farm_id', farmId)
          .order('created_at', { ascending: false });
          
        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error) {
        setError('Error fetching data: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFarmAndProducts();
  }, [farmId, user, navigate]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowAddForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
        
      if (error) throw error;
      setProducts(products.filter(product => product.id !== productId));
    } catch (error) {
      setError('Error deleting product: ' + error.message);
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select();
          
        if (error) throw error;
        
        setProducts(products.map(product => 
          product.id === editingProduct.id ? { ...product, ...productData } : product
        ));
        
        setShowAddForm(false);
        setEditingProduct(null);
        return data?.[0];
      } else {
        // Add new product
        const { data, error } = await supabase
          .from('products')
          .insert([{ ...productData, farm_id: farmId }])
          .select();
          
        if (error) throw error;
        setProducts([...products, ...data]);
        
        setShowAddForm(false);
        setEditingProduct(null);
        return data?.[0];
      }
    } catch (error) {
      setError('Error saving product: ' + error.message);
      throw error;
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!farm) {
    return <div className="error-message">Farm not found</div>;
  }

  return (
    <div className="farm-products-page">
      <header className="farm-products-header">
        <button onClick={goBack} className="back-button">
          ← Back
        </button>
        
        <div className="farm-header-info">
          <h1>{farm.name}</h1>
          {farm.location && <p className="farm-location">📍 {farm.location}</p>}
        </div>
        
        {isOwner && (
          <button onClick={handleAddProduct} className="add-product-button">
            Add New Product
          </button>
        )}
      </header>

      {farm.description && (
        <div className="farm-description">
          <p>{farm.description}</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {showAddForm && isOwner && (
        <div className="product-form-container">
          <ProductForm 
            product={editingProduct}
            onSave={handleSaveProduct}
            onCancel={() => {
              setShowAddForm(false);
              setEditingProduct(null);
            }}
          />
        </div>
      )}

      {products.length === 0 ? (
        <div className="no-products">
          <p>No products available for this farm yet.</p>
          {isOwner && (
            <button onClick={handleAddProduct} className="primary-button">
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <ProductCard 
              key={product.id}
              product={product}
              isOwner={isOwner}
              onEdit={() => handleEditProduct(product)}
              onDelete={() => handleDeleteProduct(product.id)}
              onOrder={() => navigate(`/order/${product.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 