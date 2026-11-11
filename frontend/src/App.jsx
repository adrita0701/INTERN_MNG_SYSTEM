import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import LandingPage from './pages/LandingPage';
import AdminAuth from './pages/AdminAuth';
import InternAuth from './pages/InternAuth';
import AdminDashboard from './pages/AdminDashboard';
import InternDashboard from './pages/InternDashboard';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, token } = useAuth();

  if (!token || !user) {
    // Redirect to proper authentication page
    const redirectPath = roleRequired === 'admin' ? '/admin/auth?mode=login' : '/intern/auth?mode=login';
    return <Navigate to={redirectPath} replace />;
  }

  if (roleRequired && user.role !== roleRequired) {
    // User is logged in but doesn't have the required role
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/intern/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Route wrapper that redirects logged in users away from login pages
const PublicRoute = ({ children }) => {
  const { user, token } = useAuth();

  if (token && user) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/intern/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          <Route 
            path="/admin/auth" 
            element={
              <PublicRoute>
                <AdminAuth />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/intern/auth" 
            element={
              <PublicRoute>
                <InternAuth />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute roleRequired="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/intern/dashboard" 
            element={
              <ProtectedRoute roleRequired="intern">
                <InternDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
