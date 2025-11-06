import React, { useState, useEffect } from 'react';
import { getAllNeeds, addToBasket } from '../services/api';
import AdoptionImpactTracker from '../components/AdoptionImpactTracker';
import ShelterImpactDashboard from '../components/ShelterImpactDashboard';

/**
 * NeedsList Page - REDESIGNED Apple-Style
 * Clean, minimal, spacious design with collapsible sections
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

  // UI Toggle States (for collapsible sections)
  const [showShelterImpact, setShowShelterImpact] = useState(false);
  const [showPriorityStats, setShowPriorityStats] = useState(false);
  const [showUrgentHero, setShowUrgentHero] = useState(true);

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
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'normal':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Show error state (only on critical errors, not during normal operation)
  if (error && needs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center p-8">
        <div className="text-red-400 text-2xl glass-effect rounded-2xl p-8">{error}</div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header - Clean and Spacious */}
        <div className="mb-16 text-center animate-fadeIn">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Available Needs
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Help non-profit organizations by funding their needs
          </p>
          <p className="text-sm text-gray-500 mt-4">{needs.length} needs available</p>
        </div>

        {/* Shelter-Wide Impact - Collapsible */}
        {needs.filter(n => n.org_type === 'animal_shelter').length > 0 && (
          <div className="mb-12 animate-fadeIn">
            <button
              onClick={() => setShowShelterImpact(!showShelterImpact)}
              className="w-full glass-effect hover-lift rounded-2xl p-6 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🐾</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      Shelter-Wide Impact
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Click to view platform adoption impact</p>
                  </div>
                </div>
                <span className="text-3xl text-gray-400 group-hover:text-white transition-colors">
                  {showShelterImpact ? '−' : '+'}
                </span>
              </div>
            </button>
            
            {showShelterImpact && (
              <div className="mt-6 animate-fadeIn">
                <ShelterImpactDashboard needs={needs} />
              </div>
            )}
          </div>
        )}

        {/* Priority Stats - Collapsible */}
        <div className="mb-12 animate-fadeIn">
          <button
            onClick={() => setShowPriorityStats(!showPriorityStats)}
            className="w-full glass-effect hover-lift rounded-2xl p-6 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">📊</span>
                <div>
                  <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    Needs by Priority
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">View breakdown and quick filters</p>
                </div>
              </div>
              <span className="text-3xl text-gray-400 group-hover:text-white transition-colors">
                {showPriorityStats ? '−' : '+'}
              </span>
            </div>
          </button>

          {showPriorityStats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              {/* Urgent */}
              <button
                onClick={() => handleQuickFilter('urgent')}
                className="glass-effect hover-lift rounded-2xl p-6 text-left border border-red-500/20 hover:border-red-500/40 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-red-300 font-bold text-lg">🚨 URGENT</span>
                  <span className="text-red-200 text-3xl font-bold">{urgentNeeds.length}</span>
                </div>
                <p className="text-red-200/70 text-sm mb-2">Time-sensitive needs</p>
                <p className="text-red-300 font-bold">${urgentTotal.toFixed(2)} needed</p>
              </button>

              {/* High */}
              <button
                onClick={() => handleQuickFilter('high')}
                className="glass-effect hover-lift rounded-2xl p-6 text-left border border-orange-500/20 hover:border-orange-500/40 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-orange-300 font-bold text-lg">⚠️ HIGH</span>
                  <span className="text-orange-200 text-3xl font-bold">{highNeeds.length}</span>
                </div>
                <p className="text-orange-200/70 text-sm mb-2">Important needs</p>
                <p className="text-orange-300 font-bold">${highTotal.toFixed(2)} needed</p>
              </button>

              {/* Normal */}
              <button
                onClick={() => handleQuickFilter('normal')}
                className="glass-effect hover-lift rounded-2xl p-6 text-left border border-green-500/20 hover:border-green-500/40 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-green-300 font-bold text-lg">✅ NORMAL</span>
                  <span className="text-green-200 text-3xl font-bold">{normalNeeds.length}</span>
                </div>
                <p className="text-green-200/70 text-sm mb-2">Standard needs</p>
                <p className="text-green-300 font-bold">${normalTotal.toFixed(2)} needed</p>
              </button>
            </div>
          )}

          {priorityFilter && showPriorityStats && (
            <div className="mt-6 text-center animate-fadeIn">
              <button
                onClick={handleClearFilters}
                className="glass-effect hover-lift rounded-xl px-8 py-3 text-white font-semibold hover:bg-white/10"
              >
                Show All Needs
              </button>
            </div>
          )}
        </div>

        {/* Urgent Hero - Can be toggled */}
        {urgentNeeds.length > 0 && !priorityFilter && showUrgentHero && (
          <div className="mb-12 animate-fadeIn">
            <div className="relative glass-effect rounded-3xl p-8 border-2 border-red-500/30 animate-pulse-slow overflow-hidden">
              <div className="absolute top-0 right-0 text-9xl opacity-10">🚨</div>
              
              <button
                onClick={() => setShowUrgentHero(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl">🚨</span>
                  <div>
                    <h2 className="text-4xl font-bold text-white">Urgent Needs</h2>
                    <p className="text-red-200">These time-sensitive needs require immediate attention</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {urgentNeeds.slice(0, 2).map(need => {
                    const available = need.quantity - need.quantity_fulfilled;
                    return (
                      <div key={need.id} className="bg-red-950/50 rounded-2xl p-6 border border-red-400/20">
                        <h3 className="text-2xl font-bold text-white mb-2">{need.title}</h3>
                        <p className="text-red-200 text-sm mb-4 line-clamp-2">{need.description}</p>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-red-300 font-bold text-xl">${need.cost} each</p>
                            <p className="text-red-400 text-sm">{available} needed</p>
                          </div>
                          <button
                            onClick={() => {
                              document.getElementById(`need-${need.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all hover-lift"
                          >
                            Help Now →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {urgentNeeds.length > 2 && (
                  <p className="text-red-200 text-center mt-6">
                    + {urgentNeeds.length - 2} more urgent need(s) below
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters - Minimal Design */}
        <div className="mb-12 animate-fadeIn">
          <div className="glass-effect rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Search & Filter</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-6 py-4 bg-white/5 text-white rounded-xl border border-white/10 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500"
                />
              </div>

              {/* Priority */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 text-white rounded-xl border border-white/10 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <input
                  type="text"
                  placeholder="Category..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-6 py-4 bg-white/5 text-white rounded-xl border border-white/10 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSearch}
                className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover-lift"
              >
                Search
              </button>
              <button
                onClick={handleClearFilters}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Needs List - Clean Card Design */}
        <div>
          {needs.length === 0 ? (
            <div className="text-center text-gray-400 text-xl py-24 glass-effect rounded-2xl">
              No needs available at the moment
            </div>
          ) : (
            <div className="space-y-8">
              {needs.map((need) => {
                const availableQuantity = need.quantity - need.quantity_fulfilled;
                const isUrgent = need.priority === 'urgent';
                const isHigh = need.priority === 'high';
                
                return (
                  <div
                    id={`need-${need.id}`}
                    key={need.id}
                    className={`glass-effect hover-lift rounded-3xl p-8 animate-fadeIn ${
                      isUrgent 
                        ? 'border-2 border-red-500/30' 
                        : isHigh
                        ? 'border-2 border-orange-500/20'
                        : 'border border-white/10'
                    }`}
                  >
                    {/* Urgent Banner */}
                    {isUrgent && (
                      <div className="bg-red-600/20 border border-red-500/30 text-red-200 px-6 py-3 rounded-2xl mb-6 flex items-center gap-3 font-bold">
                        <span className="text-2xl">⏰</span>
                        <span>TIME-SENSITIVE - Immediate Action Required</span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <span
                          className={`${getPriorityColor(need.priority)} px-4 py-2 rounded-xl text-sm font-bold uppercase border`}
                        >
                          {need.priority === 'urgent' ? '🚨 URGENT' : need.priority === 'high' ? '⚠️ HIGH' : need.priority}
                        </span>
                        {isUrgent && (
                          <span className="text-red-300 text-sm font-bold">
                            ⚡ HELP NOW
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 text-sm bg-white/5 px-4 py-2 rounded-xl">
                        {need.category || 'General'}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h2 className="text-3xl font-bold text-white mb-4">
                      {need.title}
                    </h2>
                    <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                      {need.description || 'No description provided'}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white/5 rounded-2xl p-4">
                        <p className="text-gray-400 text-sm mb-1">Cost per item</p>
                        <p className="text-white font-bold text-2xl">${need.cost}</p>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4">
                        <p className="text-gray-400 text-sm mb-1">Available</p>
                        <p className="text-white font-bold text-2xl">
                          {availableQuantity} / {need.quantity}
                        </p>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4">
                        <p className="text-gray-400 text-sm mb-1">Managed by</p>
                        <p className="text-white font-bold text-xl">
                          {need.manager_username || 'Unknown'}
                        </p>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4">
                        <p className="text-gray-400 text-sm mb-1">Total cost</p>
                        <p className="text-white font-bold text-2xl">
                          ${(need.cost * availableQuantity).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Funding Progress</span>
                        <span>{Math.round((need.quantity_fulfilled / need.quantity) * 100)}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${(need.quantity_fulfilled / need.quantity) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Add to Basket Section */}
                    <div className="bg-white/5 rounded-2xl p-6">
                      <div className="flex items-end gap-4">
                        {/* Quantity Input */}
                        <div className="flex-1">
                          <label className="block text-gray-300 text-sm font-semibold mb-3">
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
                            className="w-full px-6 py-4 bg-white/5 text-white rounded-xl border border-white/10 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                          />
                        </div>

                        {/* Add to Basket Button */}
                        <button
                          onClick={() => handleAddToBasket(need)}
                          disabled={availableQuantity === 0 || addingToBasket[need.id]}
                          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all hover-lift min-w-[180px] text-lg"
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
                        <div className={`mt-4 p-4 rounded-xl ${
                          basketMessages[need.id].type === 'success' 
                            ? 'bg-green-500/20 text-green-200 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-200 border border-red-500/30'
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
    </div>
  );
}

export default NeedsList;

