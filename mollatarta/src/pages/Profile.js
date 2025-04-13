import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import Messages from '../components/Messages';
import '../styles/Profile.css';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [contactFarmerData, setContactFarmerData] = useState(null);

  // Check URL parameters for active tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'messages') {
      setActiveTab('messages');
    }
  }, [location]);

  // Check for contact farmer data in sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('contactFarmer');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setContactFarmerData(parsedData);
      // Clear storage after retrieving the data
      sessionStorage.removeItem('contactFarmer');
    }
  }, []);

  // Create a new message if redirected from farms page
  useEffect(() => {
    const createInitialMessage = async () => {
      if (!user || !contactFarmerData || !contactFarmerData.farmerId) return;
      
      try {
        // Check if this would be a new conversation
        const { data: existingConversation, error: checkError } = await supabase
          .from('messages')
          .select('id')
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${contactFarmerData.farmerId},farm_id.eq.${contactFarmerData.farmId}),and(sender_id.eq.${contactFarmerData.farmerId},recipient_id.eq.${user.id},farm_id.eq.${contactFarmerData.farmId})`)
          .limit(1);
          
        if (checkError) {
          console.error('Error checking for existing conversation:', checkError);
          return;
        }
        
        // If no existing conversation, create an initial message
        if (!existingConversation || existingConversation.length === 0) {
          const subject = `Question about ${contactFarmerData.farmName}`;
          
          const { error: saveError } = await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              recipient_id: contactFarmerData.farmerId,
              farm_id: contactFarmerData.farmId,
              subject: subject,
              message: t('messages.initial_message', { farmName: contactFarmerData.farmName }),
              created_at: new Date().toISOString(),
              read: false
            });
            
          if (saveError) {
            console.error('Error creating initial message:', saveError);
          }
        }
        
        // Clear the contact data after processing
        setContactFarmerData(null);
        
      } catch (err) {
        console.error('Error in contact farmer process:', err);
      }
    };
    
    if (contactFarmerData && user) {
      createInitialMessage();
    }
  }, [contactFarmerData, user, t]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }
        
        setProfile(data);
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(t('profile.error_loading'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, navigate, t]);
  
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setError(t('profile.file_too_large'));
        return;
      }
      
      setAvatar(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatar) {
        try {
          const fileExt = avatar.name.split('.').pop();
          const fileName = `${user.id}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatar, { upsert: true });
            
          if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            // Don't throw error, continue with profile update
            if (uploadError.message.includes('Bucket not found')) {
              console.log('Storage bucket not found. Skipping avatar upload.');
            }
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
              
            newAvatarUrl = publicUrlData.publicUrl;
          }
        } catch (avatarErr) {
          console.error('Avatar upload failed:', avatarErr);
          // Continue with profile update without avatar
        }
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: newAvatarUrl
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }
      
      setMessage(t('profile.update_success'));
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || t('profile.update_error'));
    } finally {
      setSaving(false);
    }
  };
  
  const deleteProfilePhoto = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      
      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error deleting profile photo:', error);
        throw error;
      }
      
      // Update local state to reflect changes
      setAvatarUrl(null);
      setAvatar(null);
      
      setMessage(t('profile.photo_deleted', 'Profile photo deleted successfully!'));
    } catch (err) {
      console.error('Error in delete profile photo process:', err);
      setError(err.message || t('profile.update_error'));
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{t('nav.profile')}</h1>
      </div>
      
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {t('profile.info')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          {t('profile.messages')}
        </button>
      </div>
      
      <div className="profile-content">
        {activeTab === 'profile' ? (
          <>
            {loading ? (
              <div className="loading">{t('common.loading')}</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <form onSubmit={handleSubmit} className="profile-form">
                {message && <div className="success-message">{message}</div>}
                
                <div className="avatar-section">
                  <div className="avatar-preview">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={fullName || t('profile.avatar')} />
                    ) : (
                      <div className="avatar-placeholder">
                        {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  
                  <div className="avatar-upload">
                    <div className="avatar-buttons">
                      <label htmlFor="avatar" className="upload-button">
                        {t('profile.change_avatar')}
                      </label>
                      <input
                        type="file"
                        id="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                      />
                      
                      {avatarUrl && (
                        <button 
                          type="button"
                          className="delete-avatar-button"
                          onClick={deleteProfilePhoto}
                          disabled={saving}
                        >
                          {t('profile.delete_avatar', 'Delete Photo')}
                        </button>
                      )}
                    </div>
                    <p className="upload-hint">{t('profile.avatar_size_hint')}</p>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="fullName">{t('profile.full_name')}</label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('profile.full_name_placeholder')}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">{t('profile.email')}</label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="disabled-input"
                  />
                  <p className="input-hint">{t('profile.email_not_editable')}</p>
                </div>
                
                <div className="form-group">
                  <label>{t('profile.role')}</label>
                  <input
                    type="text"
                    value={profile?.role ? t(`roles.${profile.role}`) : ''}
                    disabled
                    className="disabled-input"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={saving}
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </form>
            )}
          </>
        ) : (
          <Messages />
        )}
      </div>
    </div>
  );
} 