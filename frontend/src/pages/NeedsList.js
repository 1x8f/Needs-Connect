import React, { useState, useEffect } from 'react';
import { getAllNeeds, addToBasket } from '../services/api';

/**
 * NeedsList Page - Display all available needs
 * This is the main page helpers see when they log in
 */
function NeedsList() {
  // State to store the needs from the API
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Basket states
  const [quantities, setQuantities] = useState({}); // Track quantity for each need
  const [addingToBasket, setAddingToBasket] = useState({}); // Track loading state per need
  const [basketMessages, setBasketMessages] = useState({}); // Success/error messages per need

  // TODO: Replace with actual logged-in user from authentication
  // For now, hardcoded as user 2 (john - helper)
  const currentUserId = 2;

  // Fetch needs when component loads
  useEffect(() => {
    fetchNeeds();
  }, []);

  const fetchNeeds = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllNeeds(filters);
      
      if (response.success) {
        setNeeds(response.needs);
      } else {
        setError('Failed to load needs');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching needs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (priorityFilter) filters.priority = priorityFilter;
    if (categoryFilter) filters.category = categoryFilter;
    
    fetchNeeds(filters);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setCategoryFilter('');
    fetchNeeds(); // Fetch without filters
  };

  // Handle quantity input change
  const handleQuantityChange = (needId, value) => {
    // Only allow positive integers
    const quantity = parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [needId]: quantity
    }));
    
    // Clear any previous message when user changes quantity
    setBasketMessages(prev => ({
      ...prev,
      [needId]: null
    }));
  };

  // Handle Add to Basket
  const handleAddToBasket = async (need) => {
    const quantity = quantities[need.id] || 0;
    const availableQuantity = need.quantity - need.quantity_fulfilled;

    // VALIDATION - Comprehensive checks
    
    // 1. Check if quantity is entered
    if (quantity <= 0) {
      setBasketMessages(prev => ({
        ...prev,
        [need.id]: { type: 'error', text: 'Please enter a quantity greater than 0' }
      }));
      return;
    }

    // 2. Check if quantity exceeds available
    if (quantity > availableQuantity) {
      setBasketMessages(prev => ({
        ...prev,
        [need.id]: { type: 'error', text: `Only ${availableQuantity} available` }
      }));
      return;
    }

    // 3. Start loading state for this specific need
    setAddingToBasket(prev => ({ ...prev, [need.id]: true }));
    setBasketMessages(prev => ({ ...prev, [need.id]: null }));

    try {
      // Call the API
      const response = await addToBasket({
        user_id: currentUserId,
        need_id: need.id,
        quantity: quantity
      });

      if (response.success) {
        // Success! Show success message
        setBasketMessages(prev => ({
          ...prev,
          [need.id]: { 
            type: 'success', 
            text: `Added ${quantity} ${need.title} to basket!` 
          }
        }));

        // Reset quantity input for this need
        setQuantities(prev => ({
          ...prev,
          [need.id]: 0
        }));

        // Clear success message after 3 seconds
        setTimeout(() => {
          setBasketMessages(prev => ({
            ...prev,
            [need.id]: null
          }));
        }, 3000);

      } else {
        // API returned error
        setBasketMessages(prev => ({
          ...prev,
          [need.id]: { 
            type: 'error', 
            text: response.message || 'Failed to add to basket' 
          }
        }));
      }

    } catch (err) {
      // Network or other error
      console.error('Error adding to basket:', err);
      setBasketMessages(prev => ({
        ...prev,
        [need.id]: { 
          type: 'error', 
          text: 'Error connecting to server' 
        }
      }));
    } finally {
      // Stop loading state
      setAddingToBasket(prev => ({ ...prev, [need.id]: false }));
    }
  };

  // Get color for priority badge
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-2xl">Loading needs...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-red-400 text-2xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Available Needs</h1>
        <p className="text-gray-300">Help non-profit organizations by funding their needs</p>
        <p className="text-gray-400 text-sm mt-2">Total needs: {needs.length}</p>
      </div>

      {/* Search and Filters Section */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Search & Filter</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="block text-gray-300 text-sm mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Category</label>
              <input
                type="text"
                placeholder="e.g. food, clothing..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Needs List */}
      <div className="max-w-6xl mx-auto">
        {needs.length === 0 ? (
          <div className="text-center text-gray-400 text-xl py-12">
            No needs available at the moment
          </div>
        ) : (
          <div className="grid gap-6">
            {needs.map((need) => {
              const availableQuantity = need.quantity - need.quantity_fulfilled;
              
              return (
                <div
                  key={need.id}
                  className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {/* Priority Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`${getPriorityColor(need.priority)} text-white text-xs font-bold px-3 py-1 rounded-full uppercase`}
                    >
                      {need.priority}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {need.category || 'General'}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {need.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-300 mb-4">
                    {need.description || 'No description provided'}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
                    {/* Cost */}
                    <div>
                      <p className="text-gray-400 text-sm">Cost per item</p>
                      <p className="text-white font-bold text-lg">${need.cost}</p>
                    </div>

                    {/* Available Quantity */}
                    <div>
                      <p className="text-gray-400 text-sm">Available</p>
                      <p className="text-white font-bold text-lg">
                        {availableQuantity} / {need.quantity}
                      </p>
                    </div>

                    {/* Manager */}
                    <div>
                      <p className="text-gray-400 text-sm">Managed by</p>
                      <p className="text-white font-bold text-lg">
                        {need.manager_username || 'Unknown'}
                      </p>
                    </div>

                    {/* Total if funded */}
                    <div>
                      <p className="text-gray-400 text-sm">Total cost</p>
                      <p className="text-white font-bold text-lg">
                        ${(need.cost * availableQuantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Funding Progress</span>
                      <span>{Math.round((need.quantity_fulfilled / need.quantity) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(need.quantity_fulfilled / need.quantity) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Add to Basket Section */}
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex items-end gap-4">
                      {/* Quantity Input */}
                      <div className="flex-1">
                        <label className="block text-gray-300 text-sm mb-2">
                          Quantity (max: {availableQuantity})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={availableQuantity}
                          value={quantities[need.id] || ''}
                          onChange={(e) => handleQuantityChange(need.id, e.target.value)}
                          placeholder="0"
                          disabled={availableQuantity === 0}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Add to Basket Button */}
                      <button
                        onClick={() => handleAddToBasket(need)}
                        disabled={availableQuantity === 0 || addingToBasket[need.id]}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors min-w-[140px]"
                      >
                        {addingToBasket[need.id] ? (
                          <span>Adding...</span>
                        ) : availableQuantity === 0 ? (
                          <span>Fully Funded</span>
                        ) : (
                          <span>Add to Basket</span>
                        )}
                      </button>
                    </div>

                    {/* Success/Error Message */}
                    {basketMessages[need.id] && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        basketMessages[need.id].type === 'success' 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {basketMessages[need.id].text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NeedsList;

