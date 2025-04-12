import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import AccessDenied from './AccessDenied';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    
    async function fetchUserRole() {
      if (user) {
        try {
          setRoleLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user role:', error);
            if (isMounted) setRoleLoading(false);
          } else {
            if (isMounted) {
              setUserRole(data.role);
              setRoleLoading(false);
            }
          }
        } catch (err) {
          console.error('Error in profile fetch:', err);
          if (isMounted) setRoleLoading(false);
        }
      } else {
        if (isMounted) {
          setUserRole(null);
          setRoleLoading(false);
        }
      }
    }
    
    fetchUserRole();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Show loading state if auth or role check is in progress
  if (loading || roleLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Store the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show access denied page if role not allowed
  if (!allowedRoles.includes(userRole)) {
    return <AccessDenied />;
  }

  // User is authenticated and has appropriate role
  return children;
} 