import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import '../styles/ContactFarmerModal.css';

const ContactFarmerModal = ({ isOpen, onClose, farmerId, farmerName, farmName, farmId }) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { t } = useTranslation();

  // Set default subject when farmName changes
  useEffect(() => {
    if (farmName) {
      setSubject(`Question about ${farmName}`);
    }
  }, [farmName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError(t('farms.login_to_contact'));
      return;
    }
    
    if (!message.trim()) {
      setError(t('farms.message_required'));
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      console.log('Sending message with:', {
        sender_id: user.id,
        recipient_id: farmerId, // The farmer's user ID
        farm_id: farmId, // Must be a valid farm ID, no fallback
        subject: subject.trim() || `Message about ${farmName}`,
        message: message.trim()
      });
      
      // Save message to database
      const { error: saveError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: farmerId, // The farmer's user ID
          farm_id: farmId, // Must be a valid farm ID, no fallback
          subject: subject.trim() || `Message about ${farmName}`,
          message: message.trim(),
          created_at: new Date().toISOString(),
          read: false
        });
        
      if (saveError) {
        console.error('Save error details:', saveError);
        throw saveError;
      }
      
      // Get farmer's email for notification
      const { data: farmerData, error: farmerError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', farmerId)
        .single();
      
      if (farmerError) {
        console.error('Error fetching farmer email:', farmerError);
        // Don't throw error here, just log it and continue
        // We still want the message to be considered successful even if 
        // the email fetch fails
      } else if (farmerData?.email) {
        console.log(`Would send email notification to: ${farmerData.email}`);
        // Call Supabase Edge Function to send email
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              recipientEmail: farmerData.email,
              subject: subject.trim() || `Message about ${farmName}`,
              message: message.trim(),
              farmName: farmName
            }
          });
          
          if (emailError) {
            console.error('Error sending email notification:', emailError);
          } else {
            console.log('Email notification sent successfully:', emailData);
          }
        } catch (emailSendError) {
          console.error('Failed to invoke email function:', emailSendError);
        }
      }
      
      // Success!
      setSuccess(true);
      setMessage('');
      setSubject('');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || t('farms.contact_error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="contact-modal">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <h2>{t('farms.contact_farmer')}</h2>
        {farmName && <p className="farm-name-subtitle">{farmName}</p>}
        
        {success ? (
          <div className="success-message">
            <p>{t('farms.message_sent')}</p>
            <p>{t('farms.farmer_will_receive')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="subject">{t('farms.subject')}</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('farms.subject_placeholder')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">{t('farms.message')}</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('farms.message_placeholder')}
                rows={5}
                required
              />
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <button type="submit" className="send-button" disabled={sending}>
              {sending ? t('farms.sending') : t('farms.send_message')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactFarmerModal; 