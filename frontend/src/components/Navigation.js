import React from 'react';

/**
 * Navigation Component - Simple navigation bar
 * Allows switching between Needs List and Basket
 */
function Navigation() {
  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div>
            <h1 className="text-2xl font-bold text-white">Needs Connect</h1>
            <p className="text-gray-400 text-sm">Connecting Helpers with Non-Profits</p>
          </div>

          {/* Navigation Links */}
          <div className="flex gap-4">
            <a
              href="/"
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              Browse Needs
            </a>
            <a
              href="/basket"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              🛒 Basket
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;

