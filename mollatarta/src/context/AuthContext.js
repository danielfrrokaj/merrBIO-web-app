import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [favorites, setFavorites] = useState({ farms: [], products: [] });

  useEffect(() => {
    // Get session from Supabase auth
    const getSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          setAuthError(error);
          return;
        }
        
        setSession(session);
        setUser(session?.user || null);
        
        // If we have a user, make sure their profile exists
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }
          
          // If profile doesn't exist, create it
          if (!profile) {
            try {
              const { error: createError } = await supabase
                .from('profiles')
                .upsert([
                  {
                    id: session.user.id,
                    full_name: session.user.user_metadata?.full_name || '',
                    avatar_url: session.user.user_metadata?.avatar_url || null
                  }
                ]);
                
              if (createError) console.error('Error creating profile:', createError);
            } catch (err) {
              console.error('Failed to create profile:', err);
            }
          }
        }
      } catch (err) {
        console.error('Session retrieval error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserFavorites();
    } else {
      setFavorites({ farms: [], products: [] });
    }
  }, [user]);

  async function getUser() {
    try {
      setLoading(true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
      
      setUser(session?.user || null);
    } catch (error) {
      console.error('Error in getUser:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchUserFavorites = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch farm favorites
      const { data: farmFavorites, error: farmError } = await supabase
        .from('favorites')
        .select('*, farm:farms(*)')
        .eq('user_id', user.id)
        .eq('type', 'farm')
        .not('farm', 'is', null);
      
      if (farmError) throw farmError;
      
      // Fetch product favorites
      const { data: productFavorites, error: productError } = await supabase
        .from('favorites')
        .select('*, product:products(*)')
        .eq('user_id', user.id)
        .eq('type', 'product')
        .not('product', 'is', null);
      
      if (productError) throw productError;
      
      setFavorites({
        farms: farmFavorites || [],
        products: productFavorites || []
      });
      
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, [user]);
  
  const addToFavorites = useCallback(async (type, id) => {
    if (!user) return { success: false, error: 'User not logged in' };
    
    try {
      // First check if already favorited
      const { data: existingFav, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .eq(type === 'farm' ? 'farm_id' : 'product_id', id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // If already favorited, just return
      if (existingFav) {
        return { success: true, message: 'Already in favorites' };
      }
      
      // Add to favorites
      const newFavorite = {
        user_id: user.id,
        type: type,
        [type === 'farm' ? 'farm_id' : 'product_id']: id,
        created_at: new Date()
      };
      
      const { error: insertError } = await supabase
        .from('favorites')
        .insert([newFavorite]);
      
      if (insertError) throw insertError;
      
      // Refresh favorites
      await fetchUserFavorites();
      
      return { success: true };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return { success: false, error: error.message };
    }
  }, [user, fetchUserFavorites]);
  
  const removeFromFavorites = useCallback(async (type, id) => {
    if (!user) return { success: false, error: 'User not logged in' };
    
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('type', type)
        .eq(type === 'farm' ? 'farm_id' : 'product_id', id);
      
      if (error) throw error;
      
      // Refresh favorites
      await fetchUserFavorites();
      
      return { success: true };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return { success: false, error: error.message };
    }
  }, [user, fetchUserFavorites]);
  
  const isFavorited = useCallback((type, id) => {
    if (!user || !favorites) return false;
    
    if (type === 'farm') {
      return favorites.farms.some(fav => fav.farm_id === id);
    } else if (type === 'product') {
      return favorites.products.some(fav => fav.product_id === id);
    }
    
    return false;
  }, [user, favorites]);

  async function signUp(email, password, options) {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options
      });
      
      if (error) {
        setAuthError(error);
        return { error };
      }
      
      return { data };
    } catch (error) {
      console.error('Error in signUp:', error);
      setAuthError(error);
      return { error };
    }
  }

  async function signIn(email, password) {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        setAuthError(error);
        return { error };
      }
      
      return { data };
    } catch (error) {
      console.error('Error in signIn:', error);
      setAuthError(error);
      return { error };
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  }

  function resetAuthError() {
    setAuthError(null);
  }

  const value = {
    session,
    user,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
    resetAuthError,
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    fetchUserFavorites
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 