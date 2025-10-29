import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HandHeart, 
  Package, 
  ShoppingCart, 
  Settings, 
  User, 
  ChevronDown,
  LogOut,
  Menu,
  X
} from 'lucide-react';

function Navigation() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
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
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* LEFT SECTION - Logo & Brand */}
          <div className="flex items-center gap-3">
            <HandHeart className="w-8 h-8 text-blue-600" strokeWidth={2} />
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Needs Connect</h1>
              <p className="text-xs text-slate-500">Community Support</p>
            </div>
          </div>

          {/* CENTER SECTION - Navigation Tabs (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink
              to="/browse"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  isActive || location.pathname.startsWith('/browse') || location.pathname.startsWith('/needs')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Package className="w-4 h-4" strokeWidth={2} />
              Browse Needs
            </NavLink>

            <NavLink
              to="/basket"
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <ShoppingCart className="w-4 h-4" strokeWidth={2} />
              Basket
              {basketCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {basketCount}
                </span>
              )}
            </NavLink>

            {isManager && (
              <NavLink
                to="/manager"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    isActive || location.pathname.startsWith('/manager')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Settings className="w-4 h-4" strokeWidth={2} />
                Manager
              </NavLink>
            )}
          </div>

          {/* RIGHT SECTION - User Menu (Desktop) */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              <User className="w-4 h-4" strokeWidth={2} />
              <span>{user?.username}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={2} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" strokeWidth={2} />
            ) : (
              <Menu className="w-6 h-6" strokeWidth={2} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          
          {/* Drawer */}
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-50 md:hidden">
            <div className="p-6 space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Nav Links */}
              <NavLink
                to="/browse"
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive || location.pathname.startsWith('/browse') || location.pathname.startsWith('/needs')
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Package className="w-5 h-5" strokeWidth={2} />
                <span>Browse Needs</span>
              </NavLink>

              <NavLink
                to="/basket"
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                <span>Basket</span>
                {basketCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {basketCount}
                  </span>
                )}
              </NavLink>

              {isManager && (
                <NavLink
                  to="/manager"
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive || location.pathname.startsWith('/manager')
                        ? 'text-blue-600 bg-blue-50 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Settings className="w-5 h-5" strokeWidth={2} />
                  <span>Manager</span>
                </NavLink>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 mt-4 pt-4 border-t border-slate-200"
              >
                <LogOut className="w-5 h-5" strokeWidth={2} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navigation;
