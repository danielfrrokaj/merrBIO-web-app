import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { FaPaperPlane, FaArrowLeft, FaPlus } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import '../styles/Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [farms, setFarms] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [newSubject, setNewSubject] = useState('');
  const [orderMessageSent, setOrderMessageSent] = useState(false);

  // Check URL parameters for auto-message
  useEffect(() => {
    const checkUrlParams = async () => {
      const params = new URLSearchParams(location.search);
      const farmId = params.get('farmId');
      const action = params.get('action');
      const orderId = params.get('orderId');
      const productName = params.get('productName');
      const orderNumber = params.get('orderNumber');
      
      // If we have the necessary parameters for auto-messaging about an order
      if (farmId && action === 'new' && orderId && user && !orderMessageSent) {
        console.log("Processing order message request:", { farmId, orderId, productName, orderNumber });
        
        try {
          // First get the farm details
          const { data: farmData, error: farmError } = await supabase
            .from('farms')
            .select('id, name, owner:profiles(id, full_name)')
            .eq('id', farmId)
            .single();
            
          if (farmError) {
            console.error('Error fetching farm details:', farmError);
            return;
          }
          
          if (!farmData) {
            console.error('Farm not found');
            return;
          }
          
          console.log("Found farm:", farmData);
          const farmerId = farmData.owner.id;
          
          // Prepare message about the order
          const subject = productName 
            ? `Question about my order of ${productName}`
            : `Question about my order ${orderNumber}`;
            
          const message = productName 
            ? `Hello, I'm contacting you about my order ${orderNumber} for ${productName}. I would like to get more information about this product.`
            : `Hello, I'm contacting you about my order ${orderNumber}. I would like to get more information about this order.`;
          
          // Get farms for the modal if needed
          if (!farms.length) {
            await fetchAvailableFarms();
          }
          
          // Start a new conversation
          setOrderMessageSent(true);
          setShowNewMessageModal(true);
          
          // Wait for farms to load
          setTimeout(async () => {
            // Find the target farm
            const targetFarm = farms.find(f => f.id === parseInt(farmId));
            if (targetFarm) {
              console.log("Selected farm for message:", targetFarm);
              setSelectedFarm(targetFarm);
              setNewSubject(subject);
              setNewMessage(message);
              
              // Wait a bit for state to update
              setTimeout(() => {
                handleCreateNewMessage();
              }, 800);
            } else {
              console.log("Farm not found in list, attempting direct message");
              // Fallback - create the message directly
              try {
                const { data: newMessageData, error: saveError } = await supabase
                  .from('messages')
                  .insert({
                    sender_id: user.id,
                    recipient_id: farmerId,
                    farm_id: parseInt(farmId),
                    subject: subject,
                    message: message,
                    created_at: new Date().toISOString(),
                    read: false
                  })
                  .select();
                  
                if (saveError) {
                  console.error('Error sending order message:', saveError);
                  return;
                }
                
                console.log("Direct message sent:", newMessageData);
                // Refresh conversations
                const fetchConversationsAfterSend = async () => {
                  // Fetch all conversations again
                  try {
                    const { data: sentMessages } = await supabase
                      .from('messages')
                      .select('id, recipient_id, farm_id, farms(id, name), created_at, subject')
                      .eq('sender_id', user.id)
                      .order('created_at', { ascending: false });
                    
                    const { data: receivedMessages } = await supabase
                      .from('messages')
                      .select('id, sender_id, farm_id, farms(id, name), created_at, subject')
                      .eq('recipient_id', user.id)
                      .order('created_at', { ascending: false });
                      
                    // Process and update conversations
                    const conversationMap = new Map();
                    
                    if (receivedMessages) {
                      receivedMessages.forEach(message => {
                        const key = `${message.farm_id}:${message.sender_id}`;
                        if (!conversationMap.has(key)) {
                          conversationMap.set(key, {
                            farmId: message.farm_id,
                            farmName: message.farms?.name || t('messages.unknown_farm'),
                            contactId: message.sender_id,
                            lastMessage: message,
                            unread: !message.read && message.sender_id !== user.id
                          });
                        }
                      });
                    }
                    
                    if (sentMessages) {
                      sentMessages.forEach(message => {
                        const key = `${message.farm_id}:${message.recipient_id}`;
                        if (!conversationMap.has(key)) {
                          conversationMap.set(key, {
                            farmId: message.farm_id,
                            farmName: message.farms?.name || t('messages.unknown_farm'),
                            contactId: message.recipient_id,
                            lastMessage: message,
                            unread: false
                          });
                        }
                      });
                    }
                    
                    setConversations(Array.from(conversationMap.values()));
                    // Close the modal
                    closeNewMessageModal();
                  } catch (err) {
                    console.error('Error refreshing conversations:', err);
                  }
                };
                
                fetchConversationsAfterSend();
              } catch (err) {
                console.error('Error sending direct message:', err);
              }
            }
          }, 500);
        } catch (err) {
          console.error('Error in auto-message process:', err);
        }
      }
    };
    
    if (user && location.search.includes('farmId') && !orderMessageSent) {
      checkUrlParams();
    }
  }, [user, location.search, orderMessageSent, farms]);

  // Fetch all conversations for the current user
  useEffect(() => {
    if (!user) return;
    
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        console.log("Fetching conversations for user:", user.id);
        
        // Get all unique conversations based on farm_id
        const { data: sentMessages, error: sentError } = await supabase
          .from('messages')
          .select('id, recipient_id, farm_id, farms(id, name), created_at, subject')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });
        
        if (sentError) {
          console.error('Error fetching sent messages:', sentError);
          throw sentError;
        }
        
        console.log("Sent messages:", sentMessages ? sentMessages.length : 0);
        
        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select('id, sender_id, farm_id, farms(id, name), created_at, subject')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });
        
        if (receivedError) {
          console.error('Error fetching received messages:', receivedError);
          throw receivedError;
        }
        
        console.log("Received messages:", receivedMessages ? receivedMessages.length : 0);
        
        // Fetch profiles for all message senders to get names and avatars
        const senderIds = receivedMessages ? 
          [...new Set(receivedMessages.map(msg => msg.sender_id))] : [];
          
        console.log("Fetching profiles for senders:", senderIds);
        
        // Create a map of user IDs to profile data
        const profileMap = {};
        
        if (senderIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', senderIds);
            
          if (profilesError) {
            console.error('Error fetching sender profiles:', profilesError);
          } else if (profilesData) {
            profilesData.forEach(profile => {
              // Process avatar URL if needed
              let avatarUrl = profile.avatar_url;
              if (avatarUrl && !avatarUrl.startsWith('http')) {
                // Check if it's a storage URL or just a filename
                if (!avatarUrl.includes('/')) {
                  avatarUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
                }
              }
              
              profileMap[profile.id] = {
                ...profile,
                avatar_url: avatarUrl
              };
            });
          }
        }
        
        // Combine and deduplicate conversations by farm_id
        const conversationMap = new Map();
        
        // Process received messages first (they'll have sender profiles)
        if (receivedMessages) {
          receivedMessages.forEach(message => {
            if (!message.farm_id) {
              console.warn("Message missing farm_id:", message);
              return;
            }
            
            // Get sender profile from our map
            const senderProfile = profileMap[message.sender_id];
            
            const key = `${message.farm_id}:${message.sender_id}`;
            if (!conversationMap.has(key)) {
              conversationMap.set(key, {
                farmId: message.farm_id,
                farmName: message.farms?.name || t('messages.unknown_farm'),
                contactId: message.sender_id,
                contactName: senderProfile?.full_name || t('messages.unknown_user'),
                contactAvatar: senderProfile?.avatar_url,
                lastMessage: message,
                unread: !message.read && message.sender_id !== user.id
              });
            }
          });
        }
        
        // Add sent messages
        if (sentMessages) {
          sentMessages.forEach(message => {
            if (!message.farm_id) {
              console.warn("Message missing farm_id:", message);
              return;
            }
            
            const key = `${message.farm_id}:${message.recipient_id}`;
            // Only add if we don't already have this conversation from received messages
            if (!conversationMap.has(key)) {
              conversationMap.set(key, {
                farmId: message.farm_id,
                farmName: message.farms?.name || t('messages.unknown_farm'),
                contactId: message.recipient_id,
                contactName: '', // We don't have this info from sent messages
                lastMessage: message,
                unread: false // My sent messages are always "read" by me
              });
            }
          });
        }
        
        // Convert map to array
        const conversationsArray = Array.from(conversationMap.values());
        console.log("Processed conversations:", conversationsArray.length);
        setConversations(conversationsArray);
      } catch (err) {
        console.error('Error processing conversations:', err);
        setError(t('messages.error_loading') + (err.message ? ` (${err.message})` : ''));
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, [user, t]);
  
  // Fetch messages for a specific conversation when selected
  useEffect(() => {
    if (!user || !selectedConversation) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        console.log("Fetching messages for conversation:", {
          userId: user.id,
          contactId: selectedConversation.contactId,
          farmId: selectedConversation.farmId
        });
        
        // Get messages between these users for this farm
        const query = `and(sender_id.eq.${user.id},recipient_id.eq.${selectedConversation.contactId},farm_id.eq.${selectedConversation.farmId}),` +
                      `and(sender_id.eq.${selectedConversation.contactId},recipient_id.eq.${user.id},farm_id.eq.${selectedConversation.farmId})`;
        
        console.log("Using query:", query);
        
        // Get messages first, without trying to join profiles
        const { data, error } = await supabase
          .from('messages')
          .select('id, sender_id, recipient_id, subject, message, created_at, read')
          .or(query)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching conversation messages:', error);
          throw error;
        }
        
        console.log("Fetched messages:", data ? data.length : 0);
        
        // Now fetch profile information for all unique users in these messages
        if (data && data.length > 0) {
          // Get unique user IDs from messages
          const userIds = [...new Set(
            data.flatMap(msg => [msg.sender_id, msg.recipient_id])
          )];
          
          console.log("Fetching profiles for users:", userIds);
          
          // Fetch profiles for these users
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
            
          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            // Continue anyway, we'll just show messages without profile info
          }
          
          // Create a map of user IDs to profile data
          const profileMap = {};
          if (profilesData) {
            profilesData.forEach(profile => {
              // Process avatar URL if needed
              let avatarUrl = profile.avatar_url;
              if (avatarUrl && !avatarUrl.startsWith('http')) {
                // Check if it's a storage URL or just a filename
                if (!avatarUrl.includes('/')) {
                  avatarUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
                }
              }
              
              profileMap[profile.id] = {
                ...profile,
                avatar_url: avatarUrl
              };
            });
          }
          
          // Add profile data to each message
          const messagesWithProfiles = data.map(msg => ({
            ...msg,
            senderProfile: profileMap[msg.sender_id] || null
          }));
          
          setMessages(messagesWithProfiles);
        } else {
          setMessages([]);
        }
        
        // Mark unread messages as read
        const unreadIds = data?.filter(m => 
          m.recipient_id === user.id && !m.read
        ).map(m => m.id);
        
        console.log("Marking as read:", unreadIds ? unreadIds.length : 0);
        
        if (unreadIds?.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadIds);
            
          // Update conversations list to remove unread status
          setConversations(prev => prev.map(conv => {
            if (conv.farmId === selectedConversation.farmId && 
                conv.contactId === selectedConversation.contactId) {
              return { ...conv, unread: false };
            }
            return conv;
          }));
        }
      } catch (err) {
        console.error('Error processing messages:', err);
        setError(t('messages.error_loading') + (err.message ? ` (${err.message})` : ''));
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('messages_channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `or(and(sender_id=eq.${user.id},recipient_id=eq.${selectedConversation.contactId},farm_id=eq.${selectedConversation.farmId}),and(sender_id=eq.${selectedConversation.contactId},recipient_id=eq.${user.id},farm_id=eq.${selectedConversation.farmId}))`
      }, payload => {
        console.log("Received real-time message:", payload);
        
        // Fetch the sender profile for the new message
        const fetchSenderProfile = async () => {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', payload.new.sender_id)
              .single();
              
            if (error) {
              console.error("Error fetching profile for new message:", error);
              // Add message even without profile data
              setMessages(prev => [...prev, {
                ...payload.new,
                senderProfile: null
              }]);
            } else {
              setMessages(prev => [...prev, {
                ...payload.new,
                senderProfile: profile
              }]);
            }
            
            // Auto-mark as read if I'm the recipient
            if (payload.new.recipient_id === user.id) {
              await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', payload.new.id);
            }
          } catch (err) {
            console.error("Error processing real-time message:", err);
            // Add message even if there was an error
            setMessages(prev => [...prev, {
              ...payload.new,
              senderProfile: null
            }]);
          }
        };
        
        fetchSenderProfile();
      })
      .subscribe();
      
    console.log("Subscribed to real-time messages");
      
    return () => {
      console.log("Unsubscribing from real-time messages");
      subscription.unsubscribe();
    };
  }, [user, selectedConversation, t]);
  
  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setSending(true);
      setError(null);
      
      console.log("Sending message to:", {
        recipientId: selectedConversation.contactId,
        farmId: selectedConversation.farmId,
        subject: selectedConversation.lastMessage.subject
      });
      
      const messageText = newMessage.trim();
      const timestamp = new Date().toISOString();
      
      // Save message to database
      const { data: newMessageData, error: saveError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation.contactId,
          farm_id: selectedConversation.farmId,
          subject: selectedConversation.lastMessage.subject,
          message: messageText,
          created_at: timestamp,
          read: false
        })
        .select();
        
      if (saveError) {
        console.error('Error sending message:', saveError);
        throw saveError;
      }
      
      // Immediately add the message to the UI
      if (newMessageData && newMessageData.length > 0) {
        const sentMessage = newMessageData[0];
        
        // Add to messages state with current user's profile
        setMessages(prev => [...prev, {
          ...sentMessage,
          // Add sender profile info for consistency with other messages
          senderProfile: null // No need for your own profile since sent messages don't show avatars
        }]);
        
        console.log("Message sent and added to UI:", sentMessage.id);
      } else {
        // Fallback if we don't get the inserted data back
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: tempId,
          sender_id: user.id,
          recipient_id: selectedConversation.contactId,
          farm_id: selectedConversation.farmId,
          subject: selectedConversation.lastMessage.subject,
          message: messageText,
          created_at: timestamp,
          read: false,
          senderProfile: null
        }]);
        
        console.log("Message sent with temp ID:", tempId);
      }
      
      // Clear input
      setNewMessage('');
      
    } catch (err) {
      console.error('Error in send message process:', err);
      setError(t('messages.send_error') + (err.message ? ` (${err.message})` : ''));
    } finally {
      setSending(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Same day - show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday - show "Yesterday" + time
    if (date.toDateString() === yesterday.toDateString()) {
      return `${t('messages.yesterday')} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Within last week - show day name + time
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Older - show date + time
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  // Fetch available farms when opening the new message modal
  const fetchAvailableFarms = async () => {
    try {
      setLoadingFarms(true);
      
      const { data, error } = await supabase
        .from('farms')
        .select(`
          id, 
          name, 
          owner:profiles(id, full_name)
        `);
        
      if (error) {
        console.error('Error fetching farms:', error);
        return;
      }
      
      console.log("Available farms:", data.length);
      setFarms(data || []);
    } catch (err) {
      console.error('Error in farms fetch:', err);
    } finally {
      setLoadingFarms(false);
    }
  };

  // Handle creating a new message
  const handleCreateNewMessage = async () => {
    if (!selectedFarm || !newMessage.trim() || !newSubject.trim()) {
      console.log("Missing required fields for new message:", {
        farm: !!selectedFarm,
        message: !!newMessage.trim(),
        subject: !!newSubject.trim()
      });
      return;
    }
    
    try {
      console.log("Creating new message to farm:", selectedFarm.name);
      setSending(true);
      setError(null);
      
      const messageText = newMessage.trim();
      const subject = newSubject.trim();
      const timestamp = new Date().toISOString();
      
      const { data: newMessageData, error: saveError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedFarm.owner.id,
          farm_id: selectedFarm.id,
          subject: subject,
          message: messageText,
          created_at: timestamp,
          read: false
        })
        .select();
        
      if (saveError) {
        console.error('Error sending message:', saveError);
        throw saveError;
      }
      
      console.log("New conversation started:", newMessageData[0].id);
      
      // Close the modal and reset fields
      closeNewMessageModal();
      setNewMessage('');
      setNewSubject('');
      
      // Fetch conversations again to update the list
      const fetchConversationsAfterSend = async () => {
        try {
          // Get sent and received messages
          const { data: sentMessages } = await supabase
            .from('messages')
            .select('id, recipient_id, farm_id, farms(id, name), created_at, subject')
            .eq('sender_id', user.id)
            .order('created_at', { ascending: false });
          
          const { data: receivedMessages } = await supabase
            .from('messages')
            .select('id, sender_id, farm_id, farms(id, name), created_at, subject')
            .eq('recipient_id', user.id)
            .order('created_at', { ascending: false });
          
          // Fetch profiles for message senders
          const senderIds = receivedMessages ? 
            [...new Set(receivedMessages.map(msg => msg.sender_id))] : [];
          
          // Create map of user IDs to profiles
          const profileMap = {};
          
          if (senderIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', senderIds);
              
            if (profilesData) {
              profilesData.forEach(profile => {
                // Process avatar URL if needed
                let avatarUrl = profile.avatar_url;
                if (avatarUrl && !avatarUrl.startsWith('http')) {
                  // Check if it's a storage URL or just a filename
                  if (!avatarUrl.includes('/')) {
                    avatarUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
                  }
                }
                
                profileMap[profile.id] = {
                  ...profile,
                  avatar_url: avatarUrl
                };
              });
            }
          }
          
          // Process conversations
          const conversationMap = new Map();
          
          if (receivedMessages) {
            receivedMessages.forEach(message => {
              if (!message.farm_id) return;
              const senderProfile = profileMap[message.sender_id];
              const key = `${message.farm_id}:${message.sender_id}`;
              
              if (!conversationMap.has(key)) {
                conversationMap.set(key, {
                  farmId: message.farm_id,
                  farmName: message.farms?.name || t('messages.unknown_farm'),
                  contactId: message.sender_id,
                  contactName: senderProfile?.full_name || t('messages.unknown_user'),
                  contactAvatar: senderProfile?.avatar_url,
                  lastMessage: message,
                  unread: !message.read && message.sender_id !== user.id
                });
              }
            });
          }
          
          if (sentMessages) {
            sentMessages.forEach(message => {
              if (!message.farm_id) return;
              const key = `${message.farm_id}:${message.recipient_id}`;
              
              if (!conversationMap.has(key)) {
                conversationMap.set(key, {
                  farmId: message.farm_id,
                  farmName: message.farms?.name || t('messages.unknown_farm'),
                  contactId: message.recipient_id,
                  contactName: '', // Don't have this info from sent messages
                  lastMessage: message,
                  unread: false // Sent messages are always read by sender
                });
              }
            });
          }
          
          // Update conversations
          const newConversations = Array.from(conversationMap.values());
          console.log("Updated conversations after send:", newConversations.length);
          setConversations(newConversations);
          
          // If this was triggered by the auto-message functionality, find and select the new conversation
          if (orderMessageSent) {
            const newConv = newConversations.find(
              conv => conv.farmId === selectedFarm.id && 
                     conv.contactId === selectedFarm.owner.id
            );
            
            if (newConv) {
              console.log("Auto-selecting new conversation:", newConv);
              setSelectedConversation(newConv);
            }
          }
        } catch (err) {
          console.error('Error updating conversations:', err);
        } finally {
          setSending(false);
        }
      };
      
      fetchConversationsAfterSend();
    } catch (err) {
      console.error('Error creating new conversation:', err);
      setError(t('messages.send_error') + (err.message ? ` (${err.message})` : ''));
      setSending(false);
    }
  };
  
  const openNewMessageModal = () => {
    setShowNewMessageModal(true);
    setSelectedFarm(null);
    setNewMessage('');
    setNewSubject('');
    fetchAvailableFarms();
  };
  
  const closeNewMessageModal = () => {
    setShowNewMessageModal(false);
  };
  
  // Add this helper function at the top of the component
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    
    // If it's already a full URL
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    
    // Get the Supabase URL from the environment or from the imported supabase client
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 
                        (supabase.supabaseUrl || '');
    
    // If it's a relative path in the storage bucket
    return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`;
  };
  
  if (!user) {
    return (
      <div className="messages-container">
        <div className="messages-empty-state">
          <p>{t('messages.login_required')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="messages-container">
      {!selectedConversation ? (
        // Conversations list view
        <>
          <div className="messages-header">
            <h2>{t('messages.your_conversations')}</h2>
            <button 
              className="new-message-button"
              onClick={openNewMessageModal}
              title={t('messages.new_message')}
            >
              <FaPlus /> {t('messages.new')}
            </button>
          </div>
          
          {loading ? (
            <div className="messages-loading">{t('common.loading')}</div>
          ) : error ? (
            <div className="messages-error">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="messages-empty-state">
              <p>{t('messages.no_conversations')}</p>
              <p>{t('messages.contact_farmers')}</p>
              <button 
                className="start-conversation-button"
                onClick={openNewMessageModal}
              >
                {t('messages.start_conversation')}
              </button>
            </div>
          ) : (
            <div className="conversation-list">
              {conversations.map((conv) => (
                <div 
                  key={`${conv.farmId}-${conv.contactId}`}
                  className={`conversation-item ${conv.unread ? 'unread' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="conversation-avatar">
                    {conv.contactAvatar ? (
                      <>
                        <img 
                          src={getAvatarUrl(conv.contactAvatar)} 
                          alt={conv.contactName}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div className="avatar-placeholder" style={{display: 'none'}}>{conv.contactName.charAt(0) || '?'}</div>
                      </>
                    ) : (
                      <div className="avatar-placeholder">{conv.contactName.charAt(0) || '?'}</div>
                    )}
                  </div>
                  
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="contact-name">{conv.contactName || t('messages.farmer')}</span>
                      <span className="conversation-time">{formatDate(conv.lastMessage.created_at)}</span>
                    </div>
                    
                    <div className="farm-name">{conv.farmName}</div>
                    
                    <div className="last-message">
                      {conv.lastMessage.subject}
                    </div>
                  </div>
                  
                  {conv.unread && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Individual conversation view
        <div className="conversation-detail">
          <div className="conversation-header">
            <button 
              className="back-button" 
              onClick={() => setSelectedConversation(null)}
            >
              <FaArrowLeft /> <span>{t('common.back')}</span>
            </button>
            
            <div className="conversation-title">
              <h3>{selectedConversation.contactName || t('messages.farmer')}</h3>
              <div className="conversation-farm">{selectedConversation.farmName}</div>
            </div>
          </div>
          
          {loading ? (
            <div className="messages-loading">{t('common.loading')}</div>
          ) : error ? (
            <div className="messages-error">{error}</div>
          ) : (
            <>
              <div className="message-list">
                {messages.length === 0 ? (
                  <div className="no-messages-yet">
                    <p>{t('messages.no_messages_yet')}</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`message-item ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                    >
                      {msg.sender_id !== user.id && (
                        <div className="message-avatar">
                          {msg.senderProfile?.avatar_url ? (
                            <>
                              <img 
                                src={getAvatarUrl(msg.senderProfile.avatar_url)} 
                                alt={msg.senderProfile.full_name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  const placeholder = e.target.nextElementSibling;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                              <div className="avatar-placeholder" style={{display: 'none'}}>
                                {msg.senderProfile?.full_name ? msg.senderProfile.full_name.charAt(0) : '?'}
                              </div>
                            </>
                          ) : (
                            <div className="avatar-placeholder">
                              {msg.senderProfile?.full_name ? msg.senderProfile.full_name.charAt(0) : '?'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="message-content">
                        <div className="message-text">{msg.message}</div>
                        <div className="message-time">{formatDate(msg.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('messages.type_message')}
                  required
                />
                <button 
                  type="submit" 
                  disabled={sending || !newMessage.trim()}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      )}
      
      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="modal-overlay" onClick={() => closeNewMessageModal()}>
          <div className="new-message-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('messages.new_message')}</h3>
              <button 
                className="close-button" 
                onClick={closeNewMessageModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {loadingFarms ? (
                <div className="modal-loading">{t('common.loading')}</div>
              ) : (
                <>
                  <div className="form-group">
                    <label>{t('messages.select_farm')}</label>
                    <div className="farm-select-list">
                      {farms.length === 0 ? (
                        <p className="no-farms-message">{t('messages.no_farms_available')}</p>
                      ) : (
                        farms.map(farm => (
                          <div 
                            key={farm.id}
                            className={`farm-select-item ${selectedFarm?.id === farm.id ? 'selected' : ''}`}
                            onClick={() => setSelectedFarm(farm)}
                          >
                            <div className="farm-select-name">{farm.name}</div>
                            <div className="farm-select-owner">
                              {t('messages.owned_by')}: {farm.owner?.full_name || t('messages.unknown_user')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {selectedFarm && (
                    <>
                      <div className="form-group">
                        <label htmlFor="subject">{t('messages.subject')}</label>
                        <input
                          id="subject"
                          type="text"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder={t('messages.subject_placeholder')}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="message">{t('messages.message')}</label>
                        <textarea
                          id="message"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={t('messages.message_placeholder')}
                          rows={5}
                          required
                        />
                      </div>
                      
                      <div className="modal-actions">
                        <button
                          className="send-button"
                          onClick={handleCreateNewMessage}
                          disabled={sending || !newMessage.trim() || !newSubject.trim()}
                        >
                          {sending ? t('messages.sending') : t('messages.send')}
                        </button>
                        <button 
                          className="cancel-button"
                          onClick={closeNewMessageModal}
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages; 