import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navigation Component - Apple-Style Premium Design
 * Shows user info, navigation links, and logout
 */
function Navigation() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-effect border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-4 group"
          >
            <div className="text-4xl">🤝</div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                Needs Connect
              </h1>
              <p className="text-gray-400 text-sm">Making a Difference Together</p>
            </div>
          </button>

          {/* Right Side: Navigation + User Info */}
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className={`px-6 py-3 font-semibold rounded-xl transition-all ${
                  isActive('/') 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                Browse Needs
              </button>
              
              <button
                onClick={() => navigate('/basket')}
                className={`px-6 py-3 font-semibold rounded-xl transition-all flex items-center gap-2 ${
                  isActive('/basket') 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>🛒</span>
                <span>Basket</span>
              </button>

              {/* Manager Link - Only for Managers */}
              {isManager && (
                <button
                  onClick={() => navigate('/manager')}
                  className={`px-6 py-3 font-semibold rounded-xl transition-all flex items-center gap-2 ${
                    isActive('/manager') || location.pathname.startsWith('/manager') 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>⚙️</span>
                  <span>Manager</span>
                </button>
              )}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
              {/* User Badge */}
              <div className="bg-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="text-2xl">{isManager ? '⚙️' : '👤'}</div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">{user?.username}</p>
                  <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 font-semibold rounded-xl transition-all border border-red-500/30 hover:border-red-500/50"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;

