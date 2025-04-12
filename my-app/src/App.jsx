import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './config/supabaseClient'
import Auth from './components/Auth'
import FarmerDashboard from './components/FarmerDashboard'
import ConsumerMarket from './components/ConsumerMarket'
import Nav from './components/Nav'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) getUserProfile(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) getUserProfile(session)
      else {
        setUserRole(null)
        setLoading(false)
      }
    })
  }, [])

  async function getUserProfile(session) {
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (data) setUserRole(data.role)
      setLoading(false)
    }
  }

  // Protected route component
  const ProtectedRoute = ({ children, allowedRole }) => {
    if (loading) return <div>Loading...</div>
    
    if (!session) {
      return <Navigate to="/auth" replace />
    }
    
    if (allowedRole && userRole !== allowedRole) {
      return <Navigate to="/" replace />
    }
    
    return children
  }

  return (
    <Router>
      <Nav session={session} />
      <div className="container">
        <Routes>
          <Route path="/" element={<ConsumerMarket />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRole="farmer">
                <FarmerDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}