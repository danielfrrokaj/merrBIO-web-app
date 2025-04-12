import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import FarmCard from '../components/FarmCard';
import FarmForm from '../components/FarmForm';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch user's farms
  useEffect(() => {
    async function fetchFarms() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('farms')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setFarms(data || []);
      } catch (error) {
        setError('Error fetching farms: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFarms();
  }, [user.id]);

  const handleAddNewFarm = () => {
    setEditingFarm(null);
    setShowAddForm(true);
  };

  const handleEditFarm = (farm) => {
    setEditingFarm(farm);
    setShowAddForm(true);
  };

  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm('Are you sure you want to delete this farm?')) return;
    
    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId);
        
      if (error) throw error;
      setFarms(farms.filter(farm => farm.id !== farmId));
    } catch (error) {
      setError('Error deleting farm: ' + error.message);
    }
  };

  const handleSaveFarm = async (farmData) => {
    try {
      if (editingFarm) {
        // Update existing farm
        const { error } = await supabase
          .from('farms')
          .update(farmData)
          .eq('id', editingFarm.id);
          
        if (error) throw error;
        
        setFarms(farms.map(farm => 
          farm.id === editingFarm.id ? { ...farm, ...farmData } : farm
        ));
      } else {
        // Add new farm
        const { data, error } = await supabase
          .from('farms')
          .insert([{ ...farmData, owner_id: user.id }])
          .select();
          
        if (error) throw error;
        setFarms([...farms, ...data]);
      }
      
      setShowAddForm(false);
      setEditingFarm(null);
    } catch (error) {
      setError('Error saving farm: ' + error.message);
    }
  };

  const handleViewProducts = (farmId) => {
    navigate(`/farms/${farmId}/products`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Your Farms</h1>
        <div className="dashboard-actions">
          <button onClick={handleAddNewFarm} className="primary-button">
            Add New Farm
          </button>
          <button onClick={handleLogout} className="secondary-button">
            Log Out
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <div className="farm-form-container">
          <FarmForm 
            farm={editingFarm}
            onSave={handleSaveFarm}
            onCancel={() => {
              setShowAddForm(false);
              setEditingFarm(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading your farms...</div>
      ) : farms.length === 0 ? (
        <div className="no-farms-message">
          <p>You don't have any farms yet. Create your first farm to get started!</p>
        </div>
      ) : (
        <div className="farms-grid">
          {farms.map(farm => (
            <FarmCard 
              key={farm.id}
              farm={farm}
              onEdit={() => handleEditFarm(farm)}
              onDelete={() => handleDeleteFarm(farm.id)}
              onViewProducts={() => handleViewProducts(farm.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 