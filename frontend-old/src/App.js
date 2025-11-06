import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import NeedsList from './pages/NeedsList';
import Basket from './pages/Basket';
import ManagerDashboard from './pages/ManagerDashboard';
import AddNeed from './pages/AddNeed';
import EditNeed from './pages/EditNeed';
import ManagerEvents from './pages/ManagerEvents';
import VolunteerOpportunities from './pages/VolunteerOpportunities';

// Elegant Loading Component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-accent rounded-full border-t-transparent animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white">Loading...</h2>
      </div>
    </div>
  );
}

// Page Transition Wrapper
function PageTransition({ children }) {
  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <PageTransition>{children}</PageTransition> : <Navigate to="/login" />;
}

// Manager-Only Route Component
function ManagerRoute({ children }) {
  const { isAuthenticated, isManager, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isManager) {
    return <Navigate to="/" />;
  }

  return <PageTransition>{children}</PageTransition>;
}

// App Routes Component
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-primary text-white bg-gradient-to-r from-primary via-secondary to-primary animate-aurora">
      {isAuthenticated && <Navigation />}
      <div className={isAuthenticated ? "pt-16" : ""}>
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><NeedsList /></ProtectedRoute>} />
          <Route path="/basket" element={<ProtectedRoute><Basket /></ProtectedRoute>} />
          <Route path="/volunteer" element={<ProtectedRoute><VolunteerOpportunities /></ProtectedRoute>} />
          <Route path="/manager" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
          <Route path="/manager/add-need" element={<ManagerRoute><AddNeed /></ManagerRoute>} />
          <Route path="/manager/edit-need/:needId" element={<ManagerRoute><EditNeed /></ManagerRoute>} />
          <Route path="/manager/events" element={<ManagerRoute><ManagerEvents /></ManagerRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
