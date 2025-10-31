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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 h-12 flex items-center gap-4 text-sm">
        <NavLink to="/" end className="text-blue-700">Browse</NavLink>
        <NavLink to="/basket" className="text-blue-700">Basket ({basketCount})</NavLink>
        {isManager && <NavLink to="/manager" className="text-blue-700">Manager</NavLink>}
        <span className="ml-auto text-slate-600">{user?.username}</span>
        <button onClick={() => { logout(); navigate('/login'); }} className="text-red-600">Logout</button>
      </div>
    </nav>
  );
}

export default Navigation;
