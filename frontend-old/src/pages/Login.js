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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md animate-slideInUp relative z-10">
        {/* Clean Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-10 border border-white/20">
          {/* Header - Blue Style */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HandHeart className="w-12 h-12 text-blue-600 animate-pulse-slow" strokeWidth={2} />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent tracking-tight">NeedsConnect</h1>
            </div>
            <p className="text-blue-600/80 text-lg font-medium">Sign in to continue making a difference</p>
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
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-xl animate-fadeIn text-sm shadow-lg" role="alert">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                aria-label="Login to Needs Connect"
                className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 group-hover:animate-bounce" />
                    Login
                  </span>
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
                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors duration-300 py-2 rounded-lg hover:bg-blue-50"
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
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-blue-500 animate-pulse" aria-hidden="true">💡</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        Quick Login Guide
                      </p>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Login as <span className="font-bold text-blue-700">"admin"</span> for manager access, or use any other username for helper access
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
                className="group bg-gradient-to-br from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border-2 border-sky-200 hover:border-sky-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer active:translate-y-0 active:scale-95"
              >
                <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" aria-hidden="true">👤</div>
                <p className="text-sm font-semibold text-sky-800 mb-1">Helper</p>
                <p className="text-xs text-sky-600 leading-tight">Browse & Fund</p>
              </button>
              <button
                type="button"
                onClick={handleManagerClick}
                aria-label="Switch to Manager mode - Create and manage nonprofit needs"
                className="group bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer active:translate-y-0 active:scale-95"
              >
                <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6" aria-hidden="true">⚙️</div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Manager</p>
                <p className="text-xs text-blue-600 leading-tight">Manage Needs</p>
              </button>
            </div>

            {/* Trust-Based Auth Note - Subtle */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-blue-500 pt-6 mt-6 border-t border-blue-100">
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Trust-based authentication • No password required</span>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="text-center mt-6">
          <p className="text-blue-600/60 text-xs font-medium">Needs Connect © 2025 🌱</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

