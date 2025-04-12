import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function ProtectedRoute ({ children, requiredRole }) {
  const { isAuthenticated, profile, isLoading } = useAuth()
  
  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Check role if required
  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to dashboard or unauthorized page
    return <Navigate to="/unauthorized" replace />
  }
  
  // If authenticated and has required role (if any), render the children
  return children
}

export default ProtectedRoute 