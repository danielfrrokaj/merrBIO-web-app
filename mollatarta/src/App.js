import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Navigation from './components/Navigation';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import FarmProducts from './pages/FarmProducts';
import OrderProduct from './pages/OrderProduct';
import MyOrders from './pages/MyOrders';
import OrdersReceived from './pages/OrdersReceived';
import CategoryProducts from './pages/CategoryProducts';
import AllProducts from './pages/AllProducts';
import DbCheck from './pages/DbCheck';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';

// Styles
import './styles/App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <ToastContainer position="bottom-right" autoClose={3000} />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      <Navigation />
      <main className="content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/farms" element={<Farms />} />
          <Route path="/farms/:farmId" element={<FarmProducts />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/categories/:categoryId" element={<CategoryProducts />} />
          <Route path="/db-check" element={<DbCheck />} />
          
          {/* Add Favorites route */}
          <Route 
            path="/favorites" 
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            } 
          />
          
          {/* Add Profile route */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/images/logo.png" alt="Molla t'Arta" className="footer-logo-image" />
            <span className="footer-logo-text" dangerouslySetInnerHTML={{ __html: t('app_name') }}></span>
          </div>
          
          <div className="footer-links">
            <div className="footer-section">
              <h3>{t('footer.quick_links')}</h3>
              <ul>
                <li><Link to="/" onClick={scrollToTop}>{t('footer.home')}</Link></li>
                <li><Link to="/farms" onClick={scrollToTop}>{t('footer.farms')}</Link></li>
                <li><Link to="/products" onClick={scrollToTop}>{t('footer.products')}</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>{t('footer.customer_service')}</h3>
              <ul>
                {!user ? (
                  <>
                    <li><Link to="/login" onClick={scrollToTop}>{t('footer.login')}</Link></li>
                    <li><Link to="/signup" onClick={scrollToTop}>{t('footer.signup')}</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/dashboard" onClick={scrollToTop}>{t('nav.my_farms')}</Link></li>
                    <li><Link to="/my-orders" onClick={scrollToTop}>{t('nav.my_orders')}</Link></li>
                  </>
                )}
                <li><a href="mailto:info@mollatarta.com">{t('footer.contact')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p dangerouslySetInnerHTML={{ __html: `&copy; 2025 ${t('app_name')}. ${t('footer.rights')}` }}></p>
            <p>{t('footer.created')}</p>
          </div>
        </div>
      </footer>
      <LanguageSwitcher />
    </div>
  );
}

export default App; 