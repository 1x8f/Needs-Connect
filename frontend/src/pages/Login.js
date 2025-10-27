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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Glassmorphism Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 border border-slate-200/50 p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <HandHeart className="w-12 h-12 text-blue-600" strokeWidth={2} />
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Needs Connect</h1>
            </div>
            <p className="text-slate-500 text-base mt-3">Sign in to continue making a difference</p>
            {/* Decorative divider */}
            <div className="w-20 h-1 bg-blue-600 rounded-full mx-auto mt-6"></div>
          </div>

          {/* Login Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div>
                <label 
                  htmlFor="username-input" 
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  {/* User Icon Inside Input */}
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg 
                      className={`w-5 h-5 ${error ? 'text-red-400' : 'text-slate-400'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
                    </svg>
                  </div>
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
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 text-slate-900 rounded-xl border-2 ${
                      error 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
                    } focus:bg-white focus:outline-none focus:ring-4 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl animate-fadeIn" role="alert">
                  <div className="flex items-center gap-3">
                    <span className="text-xl text-red-500" aria-hidden="true">⚠️</span>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                aria-label="Login to Needs Connect"
                className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-400 text-white font-semibold text-base rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Login</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
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
                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors duration-200 py-2 rounded-lg hover:bg-slate-50"
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
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-slate-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-amber-500" aria-hidden="true">💡</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 mb-2">
                        Quick Login Guide
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
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
                className="group bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-cyan-50 border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer active:translate-y-0 active:scale-95"
              >
                <div className="text-3xl mb-2 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">👤</div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Helper</p>
                <p className="text-xs text-slate-500 leading-tight">Browse & Fund</p>
              </button>
              <button
                type="button"
                onClick={handleManagerClick}
                aria-label="Switch to Manager mode - Create and manage nonprofit needs"
                className="group bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-cyan-50 border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl p-6 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer active:translate-y-0 active:scale-95"
              >
                <div className="text-3xl mb-2 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">⚙️</div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Manager</p>
                <p className="text-xs text-slate-500 leading-tight">Manage Needs</p>
              </button>
            </div>

            {/* Trust-Based Auth Note - Subtle */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-6 mt-6 border-t border-slate-100">
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Trust-based authentication • No password required</span>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-xs">Needs Connect © 2025</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

