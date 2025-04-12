import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../lib/supabase'

const AuthContext = createContext()

function AuthProvider ({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true)
      
      try {
        // Check if there's an active session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setUser(session.user)
          // Fetch user profile
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error.message)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    // Clean up subscription
    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  // Fetch user profile from user_profiles table
  async function fetchUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error.message)
      setProfile(null)
    }
  }

  // Sign up a new user
  async function signUp({ email, password, full_name, role = 'consumer' }) {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role
          }
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error during sign up:', error.message)
      setError(error.message)
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign in a user
  async function signIn({ email, password }) {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error during sign in:', error.message)
      setError(error.message)
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out
  async function signOut() {
    try {
      setIsLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      // Clear state
      setUser(null)
      setProfile(null)
      
      return { error: null }
    } catch (error) {
      console.error('Error during sign out:', error.message)
      setError(error.message)
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  // Update user profile
  async function updateProfile(updates) {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local profile state
      setProfile({ ...profile, ...updates })
      
      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error.message)
      setError(error.message)
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  // Request password reset
  async function resetPassword(email) {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error requesting password reset:', error.message)
      setError(error.message)
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  // Update password
  async function updatePassword(newPassword) {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating password:', error.message)
      setError(error.message)
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user has a specific role
  function hasRole(requiredRole) {
    if (!profile) return false
    return profile.role === requiredRole
  }

  // Auth context value
  const value = {
    user,
    profile,
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    hasRole,
    isFarmer: profile?.role === 'farmer',
    isConsumer: profile?.role === 'consumer',
    isSuperAdmin: profile?.role === 'superadmin',
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthProvider, useAuth } 