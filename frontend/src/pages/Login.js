import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HandHeart, HelpCircle, Lock } from 'lucide-react';

/**
 * Login Page - Modern Split-Screen Design
 * Left: Gradient with illustration and tagline
 * Right: Clean login form
 */
function Login() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const usernameInputRef = useRef(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous error
    setError('');

    // Validation
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await login(username.trim());

      if (result.success) {
        // Success! Navigate based on role
        if (result.user.role === 'manager') {
          navigate('/manager');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick login handlers
  const handleHelperClick = () => {
    setUsername('');
    usernameInputRef.current?.focus();
  };

  const handleManagerClick = () => {
    setUsername('admin');
    usernameInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      {/* Main Login Card */}
      <div className="w-full max-w-md animate-slideInUp">
        {/* Clean Card */}
        <div className="bg-white rounded-2xl shadow-xl p-10">
          {/* Header - Apple Style */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HandHeart className="w-10 h-10 text-emerald-600" strokeWidth={2} />
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">NeedsConnect</h1>
            </div>
            <p className="text-gray-600 text-base">Sign in to continue making a difference</p>
          </div>

          {/* Login Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div>
                <label 
                  htmlFor="username-input" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Username
                </label>
                <input
                  id="username-input"
                  type="text"
                  ref={usernameInputRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={loading}
                  aria-label="Username"
                  aria-invalid={error ? 'true' : 'false'}
                  className={`input-green text-sm ${
                    error ? 'border-red-300 focus:border-red-500' : ''
                  }`}
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-fadeIn text-sm" role="alert">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                aria-label="Login to Needs Connect"
                className="btn-green-primary w-full text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Need Help? Collapsible Guide - Below login button */}
            <div className="mt-4 space-y-2">
              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                aria-expanded={showHelp}
                aria-controls="help-content"
                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-600 text-sm font-medium transition-colors duration-300 py-2 rounded-lg hover:bg-emerald-50"
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                <span>Need help logging in?</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${showHelp ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Collapsible Content with Smooth Slide Animation */}
              <div 
                id="help-content"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showHelp ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-amber-500" aria-hidden="true">💡</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 mb-2">
                        Quick Login Guide
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        Login as <span className="font-bold text-emerald-700">"admin"</span> for manager access, or use any other username for helper access
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Helper/Manager Quick Login Cards */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleHelperClick}
                aria-label="Switch to Helper mode - Browse and fund nonprofit needs"
                className="group bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 hover:border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer active:translate-y-0 active:scale-95"
              >
                <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" aria-hidden="true">👤</div>
                <p className="text-sm font-semibold text-emerald-800 mb-1">Helper</p>
                <p className="text-xs text-emerald-600 leading-tight">Browse & Fund</p>
              </button>
              <button
                type="button"
                onClick={handleManagerClick}
                aria-label="Switch to Manager mode - Create and manage nonprofit needs"
                className="group bg-gradient-to-br from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 border-2 border-teal-200 hover:border-teal-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer active:translate-y-0 active:scale-95"
              >
                <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6" aria-hidden="true">⚙️</div>
                <p className="text-sm font-semibold text-teal-800 mb-1">Manager</p>
                <p className="text-xs text-teal-600 leading-tight">Manage Needs</p>
              </button>
            </div>

            {/* Trust-Based Auth Note - Subtle */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-500 pt-6 mt-6 border-t border-emerald-100">
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Trust-based authentication • No password required</span>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="text-center mt-6">
          <p className="text-emerald-600/60 text-xs font-medium">Needs Connect © 2025 🌱</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

