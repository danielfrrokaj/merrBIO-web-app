import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

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

  const value = {
    session,
    user,
    loading,
    authError,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    },
    resetAuthError: () => setAuthError(null)
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