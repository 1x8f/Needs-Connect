import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navigation() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Get basket count from localStorage
  const getBasketCount = () => {
    const basket = JSON.parse(localStorage.getItem('basket') || '[]');
    return basket.reduce((total, item) => total + item.quantity, 0);
  };
  
  const [basketCount, setBasketCount] = useState(getBasketCount());

  // Update basket count on storage change
  React.useEffect(() => {
    const handleStorageChange = () => {
      setBasketCount(getBasketCount());
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically
    const interval = setInterval(handleStorageChange, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-1">
        <div className="flex items-center gap-2 mr-6">
          <svg className="w-7 h-7 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-semibold text-xl text-gray-900 tracking-tight">NeedsConnect</span>
        </div>
        
        <NavLink 
          to="/" 
          end 
          className={({isActive}) => `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Browse
        </NavLink>
        
        <NavLink 
          to="/basket" 
          className={({isActive}) => `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 relative ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Basket 
          {basketCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full font-semibold flex items-center justify-center">
              {basketCount}
            </span>
          )}
        </NavLink>
        
        <NavLink 
          to="/volunteer" 
          className={({isActive}) => `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
        >
          Volunteer
        </NavLink>
        
        {isManager && (
          <>
            <NavLink 
              to="/manager" 
              className={({isActive}) => `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Manager
            </NavLink>
            <NavLink 
              to="/manager/events" 
              className={({isActive}) => `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Events
            </NavLink>
          </>
        )}
        
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">
            {user?.username}
          </span>
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium text-sm transition-all duration-150"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
