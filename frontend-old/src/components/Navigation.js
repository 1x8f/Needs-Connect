import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navigation() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  
  const getBasketCount = () => {
    const basket = JSON.parse(localStorage.getItem('basket') || '[]');
    return basket.reduce((total, item) => total + item.quantity, 0);
  };
  
  const [basketCount, setBasketCount] = useState(getBasketCount());

  React.useEffect(() => {
    const handleStorageChange = () => {
      setBasketCount(getBasketCount());
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const linkClass = ({ isActive }) => 
    `px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 relative ` +
    (isActive 
      ? 'text-white bg-accent/20 shadow-lg shadow-accent/30' 
      : 'text-gray-300 hover:text-white hover:bg-white/10');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/80 backdrop-blur-lg border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <svg className="w-7 h-7 text-accent group-hover:text-white transition-all duration-300 transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="font-semibold text-lg text-white tracking-wider">NeedsConnect</span>
          </div>
          
          <div className="flex items-center gap-2">
            <NavLink to="/" end className={linkClass}>Browse</NavLink>
            <NavLink to="/basket" className={linkClass}>
              Basket
              {basketCount > 0 && (
                <span className="absolute -top-2 -right-2 px-2 h-5 bg-accent text-white text-xs rounded-full font-bold flex items-center justify-center shadow-lg animate-pulse">
                  {basketCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/volunteer" className={linkClass}>Volunteer</NavLink>
            
            {isManager && (
              <>
                <NavLink to="/manager" className={linkClass}>Manager</NavLink>
                <NavLink to="/manager/events" className={linkClass}>Events</NavLink>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-gray-300 text-sm">
            Welcome, <span className="font-medium text-white">{user?.username}</span>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-md font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-px active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
