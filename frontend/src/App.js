import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  const { isAuthenticated, loading } = useAuth();
  
  console.log('AppRoutes rendering... isAuthenticated:', isAuthenticated, 'loading:', loading);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Only show if authenticated */}
      {isAuthenticated && <Navigation />}
      
      {/* Main Content Area with padding for nav */}
      <div className={isAuthenticated ? "pt-16" : ""}>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

        {/* Protected Routes (Require Authentication) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <NeedsList />
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
        <Route
          path="/volunteer"
          element={
            <ProtectedRoute>
              <VolunteerOpportunities />
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
          <Route
            path="/manager/events"
            element={
              <ManagerRoute>
                <ManagerEvents />
              </ManagerRoute>
            }
          />

          {/* Catch all - redirect to home or login */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  console.log('App component rendering...');
  
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
