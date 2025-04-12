import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Navigation from './components/Navigation';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import FarmProducts from './pages/FarmProducts';
import OrderProduct from './pages/OrderProduct';
import MyOrders from './pages/MyOrders';
import OrdersReceived from './pages/OrdersReceived';
import DbCheck from './pages/DbCheck';

// Styles
import './styles/App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navigation />
          <main className="content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/farms" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/farms" element={<Farms />} />
              <Route path="/farms/:farmId" element={<FarmProducts />} />
              <Route path="/db-check" element={<DbCheck />} />
              
              {/* Farmer-specific routes */}
              <Route 
                path="/dashboard" 
                element={
                  <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/farms/:farmId/products" 
                element={
                  <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <FarmProducts />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/orders-received" 
                element={
                  <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                    <OrdersReceived />
                  </RoleProtectedRoute>
                } 
              />
              
              {/* Consumer-specific routes */}
              <Route 
                path="/order/:productId" 
                element={
                  <RoleProtectedRoute allowedRoles={['consumer', 'admin']}>
                    <OrderProduct />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/my-orders" 
                element={
                  <RoleProtectedRoute allowedRoles={['consumer', 'admin']}>
                    <MyOrders />
                  </RoleProtectedRoute>
                } 
              />
              
              {/* Admin-specific routes */}
              <Route 
                path="/admin" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/admin/farms" 
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/farms" />} />
            </Routes>
          </main>
          <footer className="footer">
            <div className="footer-content">
              <p>&copy; {new Date().getFullYear()} FarmConnect. All rights reserved.</p>
              <p>Created for Sfida Hackathon</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 