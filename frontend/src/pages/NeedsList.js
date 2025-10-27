import React, { useState, useEffect } from 'react';
import { getAllNeeds, addToBasket } from '../services/api';
import AdoptionImpactTracker from '../components/AdoptionImpactTracker';
import ShelterImpactDashboard from '../components/ShelterImpactDashboard';

/**
 * NeedsList Page - Display all available needs
 * This is the main page helpers see when they log in
 */
function NeedsList() {
  // State to store the needs from the API
  const [needs, setNeeds] = useState([]);
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

  // Show error state (only on critical errors, not during normal operation)
  if (error && needs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-red-400 text-2xl">{error}</div>
      </div>
    );
  }

  // Calculate priority statistics
  const urgentNeeds = needs.filter(need => need.priority === 'urgent');
  const highNeeds = needs.filter(need => need.priority === 'high');
  const normalNeeds = needs.filter(need => need.priority === 'normal');

  // Calculate total costs by priority
  const urgentTotal = urgentNeeds.reduce((sum, need) => {
    const available = need.quantity - need.quantity_fulfilled;
    return sum + (need.cost * available);
  }, 0);
  
  const highTotal = highNeeds.reduce((sum, need) => {
    const available = need.quantity - need.quantity_fulfilled;
    return sum + (need.cost * available);
  }, 0);

  const normalTotal = normalNeeds.reduce((sum, need) => {
    const available = need.quantity - need.quantity_fulfilled;
    return sum + (need.cost * available);
  }, 0);

  // Quick filter handlers
  const handleQuickFilter = (priority) => {
    setPriorityFilter(priority);
    setSearchTerm('');
    setCategoryFilter('');
    fetchNeeds({ priority });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Available Needs</h1>
        <p className="text-gray-300">Help non-profit organizations by funding their needs</p>
        <p className="text-gray-400 text-sm mt-2">Total needs: {needs.length}</p>
      </div>

      {/* Shelter-Wide Impact Dashboard */}
      <div className="max-w-6xl mx-auto">
        <ShelterImpactDashboard needs={needs} />
      </div>

      {/* Priority Statistics Dashboard */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 shadow-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            📊 Needs by Priority
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Urgent Stats */}
            <button
              onClick={() => handleQuickFilter('urgent')}
              className="bg-red-900 border-2 border-red-500 rounded-lg p-4 hover:bg-red-800 transition-all transform hover:scale-105 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-300 font-bold text-lg">🚨 URGENT</span>
                <span className="text-red-200 text-2xl font-bold">{urgentNeeds.length}</span>
              </div>
              <p className="text-red-200 text-sm mb-1">Time-sensitive needs</p>
              <p className="text-red-300 font-bold">${urgentTotal.toFixed(2)} needed</p>
              {urgentNeeds.length > 0 && (
                <p className="text-red-400 text-xs mt-2">⚡ Click to view urgent needs</p>
              )}
            </button>

            {/* High Priority Stats */}
            <button
              onClick={() => handleQuickFilter('high')}
              className="bg-orange-900 border-2 border-orange-500 rounded-lg p-4 hover:bg-orange-800 transition-all transform hover:scale-105 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-300 font-bold text-lg">⚠️ HIGH</span>
                <span className="text-orange-200 text-2xl font-bold">{highNeeds.length}</span>
              </div>
              <p className="text-orange-200 text-sm mb-1">Important needs</p>
              <p className="text-orange-300 font-bold">${highTotal.toFixed(2)} needed</p>
              {highNeeds.length > 0 && (
                <p className="text-orange-400 text-xs mt-2">⚡ Click to view high priority</p>
              )}
            </button>

            {/* Normal Stats */}
            <button
              onClick={() => handleQuickFilter('normal')}
              className="bg-green-900 border-2 border-green-500 rounded-lg p-4 hover:bg-green-800 transition-all transform hover:scale-105 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-300 font-bold text-lg">✅ NORMAL</span>
                <span className="text-green-200 text-2xl font-bold">{normalNeeds.length}</span>
              </div>
              <p className="text-green-200 text-sm mb-1">Standard needs</p>
              <p className="text-green-300 font-bold">${normalTotal.toFixed(2)} needed</p>
              {normalNeeds.length > 0 && (
                <p className="text-green-400 text-xs mt-2">⚡ Click to view normal priority</p>
              )}
            </button>
          </div>

          {/* Clear Filter Button */}
          {priorityFilter && (
            <button
              onClick={() => {
                handleClearFilters();
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Show All Needs
            </button>
          )}
        </div>
      </div>

      {/* Urgent Needs Hero Section */}
      {urgentNeeds.length > 0 && !priorityFilter && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-red-900 to-red-800 border-2 border-red-500 rounded-lg p-6 shadow-2xl animate-pulse-slow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🚨</span>
              <div>
                <h2 className="text-3xl font-bold text-white">Urgent Needs - Immediate Help Required!</h2>
                <p className="text-red-200">These time-sensitive needs require immediate attention</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {urgentNeeds.slice(0, 2).map(need => {
                const available = need.quantity - need.quantity_fulfilled;
                return (
                  <div key={need.id} className="bg-red-950 rounded-lg p-4 border border-red-400">
                    <h3 className="text-xl font-bold text-white mb-2">{need.title}</h3>
                    <p className="text-red-200 text-sm mb-2">{need.description?.substring(0, 80)}...</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-red-300 font-bold">${need.cost} each</p>
                        <p className="text-red-400 text-sm">{available} needed</p>
                      </div>
                      <button
                        onClick={() => {
                          document.getElementById(`need-${need.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                      >
                        Help Now →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {urgentNeeds.length > 2 && (
              <p className="text-red-200 text-center">
                + {urgentNeeds.length - 2} more urgent need(s) below
              </p>
            )}
          </div>
        </div>
      )}

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
              
              const isUrgent = need.priority === 'urgent';
              const isHigh = need.priority === 'high';
              
              return (
                <div
                  id={`need-${need.id}`}
                  key={need.id}
                  className={`rounded-lg p-6 shadow-lg hover:shadow-xl transition-all ${
                    isUrgent 
                      ? 'bg-gradient-to-br from-red-900 to-gray-800 border-2 border-red-500 shadow-red-500/50' 
                      : isHigh
                      ? 'bg-gradient-to-br from-orange-900 to-gray-800 border-2 border-orange-500 shadow-orange-500/30'
                      : 'bg-gray-800'
                  }`}
                >
                  {/* Urgent Time-Sensitive Banner */}
                  {isUrgent && (
                    <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-3 flex items-center gap-2 font-bold">
                      <span className="text-xl">⏰</span>
                      <span>TIME-SENSITIVE - Immediate Action Required</span>
                    </div>
                  )}

                  {/* Priority Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${getPriorityColor(need.priority)} text-white text-xs font-bold px-3 py-1 rounded-full uppercase`}
                      >
                        {need.priority === 'urgent' ? '🚨 URGENT' : need.priority === 'high' ? '⚠️ HIGH' : need.priority}
                      </span>
                      {isUrgent && (
                        <span className="text-red-300 text-xs font-bold">
                          ⚡ HELP NOW
                        </span>
                      )}
                    </div>
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

                  {/* Adoption Impact Tracker - Only for Animal Shelter needs */}
                  {need.org_type === 'animal_shelter' && (
                    <AdoptionImpactTracker need={need} />
                  )}
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

