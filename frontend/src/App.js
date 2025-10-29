import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import CategorySelection from './pages/CategorySelection';
import NeedsList from './pages/NeedsList';
import NeedDetails from './pages/NeedDetails';
import Basket from './pages/Basket';
import ManagerDashboard from './pages/ManagerDashboard';
import AddNeed from './pages/AddNeed';
import EditNeed from './pages/EditNeed';

// Protected Route Component - Redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-900 text-2xl">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Manager-Only Route Component
function ManagerRoute({ children }) {
  const { isAuthenticated, isManager, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-900 text-2xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isManager) {
    return <Navigate to="/" />;
  }

  return children;
}

// App Routes Component (needs auth context)
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation - Only show if authenticated */}
      {isAuthenticated && <Navigation />}
      
      {/* Main Content Area */}
      <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (Require Authentication) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CategorySelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse"
            element={
              <ProtectedRoute>
                <CategorySelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse/category/:categorySlug"
            element={
              <ProtectedRoute>
                <NeedsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/needs/:needId"
            element={
              <ProtectedRoute>
                <NeedDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/basket"
            element={
              <ProtectedRoute>
                <Basket />
              </ProtectedRoute>
            }
          />

          {/* Manager-Only Routes */}
          <Route
            path="/manager"
            element={
              <ManagerRoute>
                <ManagerDashboard />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/add-need"
            element={
              <ManagerRoute>
                <AddNeed />
              </ManagerRoute>
            }
          />
          <Route
            path="/manager/edit-need/:needId"
            element={
              <ManagerRoute>
                <EditNeed />
              </ManagerRoute>
            }
          />

          {/* Catch all - redirect to home or login */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
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
