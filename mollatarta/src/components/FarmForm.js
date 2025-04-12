import React, { useState, useEffect } from 'react';
import '../styles/FarmForm.css';

export default function FarmForm({ farm, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If editing, populate the form with existing data
  useEffect(() => {
    if (farm) {
      setFormData({
        name: farm.name || '',
        location: farm.location || '',
        description: farm.description || '',
        image_url: farm.image_url || ''
      });
    }
  }, [farm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Farm name is required');
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      setError('Failed to save farm: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="farm-form">
      <h2>{farm ? 'Edit Farm' : 'Add New Farm'}</h2>
      
      {error && <div className="form-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Farm Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter farm name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter farm location"
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
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Describe your farm"
          />
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
            {loading ? 'Saving...' : 'Save Farm'}
          </button>
        </div>
      </form>
    </div>
  );
} 