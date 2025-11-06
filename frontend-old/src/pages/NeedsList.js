import React, { useState, useEffect, useCallback } from 'react';
import { getAllNeeds } from '../services/api';
import { ShoppingCart, Package, Minus, Plus } from 'lucide-react';

const NeedsList = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({}); // per-need quantity to add
  const [filters, setFilters] = useState({
    sort: 'urgency',
    bundle: 'all',
    perishable: false,
    service: false
  });

  const fetchNeeds = useCallback(async () => {
    try {
      setLoading(true);
      const query = {
        sort: filters.sort,
        timeSensitiveOnly: true
      };
      if (filters.bundle && filters.bundle !== 'all') {
        query.bundle = filters.bundle;
      }
      if (filters.perishable) {
        query.perishable = true;
      }
      if (filters.service) {
        query.service = true;
      }

      const response = await getAllNeeds(query);
      if (response.success) {
        setNeeds(response.needs || []);
        setError(null);
      } else {
        setError(response.message || 'Failed to load needs');
      }
    } catch (err) {
      setError('Failed to load needs');
      console.error('Error fetching needs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  useEffect(() => {
    const onNeedsUpdated = () => fetchNeeds();
    window.addEventListener('needs-updated', onNeedsUpdated);
    return () => window.removeEventListener('needs-updated', onNeedsUpdated);
  }, [fetchNeeds]);

  const handleAddToBasket = (need) => {
    try {
      let basket = JSON.parse(localStorage.getItem('basket') || '[]');
      const existingItemIndex = basket.findIndex(item => item.id === need.id);
      const qty = Math.max(1, Number(quantities[need.id] || 1));

      if (existingItemIndex > -1) {
        basket[existingItemIndex].quantity = Number(basket[existingItemIndex].quantity || 0) + qty;
      } else {
        basket.push({
          id: need.id,
          title: need.title,
          cost: need.cost,
          quantity: qty,
          category: need.category,
          organization: need.org_type
        });
      }

      localStorage.setItem('basket', JSON.stringify(basket));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error adding to basket:', err);
      alert('Failed to add item to basket. Please try again.');
    }
  };

  const isInBasket = (needId) => {
    const basket = JSON.parse(localStorage.getItem('basket') || '[]');
    return basket.some(item => item.id === needId);
  };

  const formatNeededBy = (dateString) => {
    if (!dateString) return 'Flexible timing';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Flexible timing';
    return `Needed by ${date.toLocaleDateString()}`;
  };

  const getUrgencyIndicator = (need) => {
    const score = need.urgency_score || 0;
    const dueIn = need.due_in_days;

    if (score >= 70 || (dueIn !== null && dueIn !== undefined && dueIn <= 3)) {
      return { label: 'Urgent', color: 'badge-urgent' };
    } else if (score >= 50 || (dueIn !== null && dueIn !== undefined && dueIn <= 7)) {
      return { label: 'High Priority', color: 'badge-warning' };
    } else if (score >= 30) {
      return { label: 'Important', color: 'badge-green' };
    }
    return { label: 'Standard', color: 'badge-teal' };
  };

  const bundleOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'basic_food', label: 'Basic Food' },
    { value: 'winter_clothing', label: 'Winter Clothing' },
    { value: 'hygiene_kit', label: 'Hygiene Kit' },
    { value: 'cleaning_supplies', label: 'Cleaning Supplies' },
    { value: 'beautification', label: 'Beautification' },
    { value: 'other', label: 'Other' }
  ];

  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  const handleBundleChange = (e) => {
    setFilters(prev => ({ ...prev, bundle: e.target.value }));
  };

  const togglePerishableOnly = () => {
    setFilters(prev => ({ ...prev, perishable: !prev.perishable }));
  };

  const toggleServiceOnly = () => {
    setFilters(prev => ({ ...prev, service: !prev.service }));
  };

  const handleQuantityChange = (needId, change) => {
    const need = needs.find(n => n.id === needId);
    if (!need) return;
    const remaining = Math.max(0, (need.quantity || 0) - (need.quantity_fulfilled || 0));
    setQuantities(prev => {
      const current = Number(prev[needId] || 1);
      const newQty = Math.max(1, Math.min(current + change, remaining || 1));
      return { ...prev, [needId]: newQty };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <div className="relative inline-block">
              <svg className="w-16 h-16 text-sky-300 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full blur-xl opacity-50 animate-glow"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-sky-200 to-white bg-clip-text text-transparent">
            Loading Opportunities
          </h2>
          <p className="text-sky-100 text-sm">Finding ways to make a difference...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center relative z-10">
          <div className="mb-8">
            <svg className="w-20 h-20 text-red-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-red-200 to-white bg-clip-text text-transparent">
            Something went wrong
          </h2>
          <p className="text-sky-100 mb-6 max-w-md mx-auto">{error}</p>
          <button 
            onClick={fetchNeeds} 
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-sky-500/30 transform hover:-translate-y-0.5"
          >
            Try Again
          </button>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-16 animate-slideInRight">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Beautiful Blue Theme */}
        <div className="hero-section mb-16 animate-slideInUp text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Make an <span className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">Impact</span>
            </h1>
            <p className="text-xl lg:text-2xl text-sky-100 mb-12 leading-relaxed font-normal">
              Transform lives by supporting community needs. Every contribution creates lasting change.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl font-bold text-white mb-2">{needs.length}</div>
                <div className="text-sm text-sky-200 font-medium">Active Needs</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl font-bold text-white mb-2">{needs.filter(n => n.urgency_score >= 70).length}</div>
                <div className="text-sm text-sky-200 font-medium">Urgent</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl font-bold text-white mb-2">{needs.filter(n => n.service_required).length}</div>
                <div className="text-sm text-sky-200 font-medium">Volunteer Opportunities</div>
              </div>
            </div>
          </div>
        </div>

      {/* Filters Card - Apple Style */}
      <div className="mb-12">
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Sort By</label>
              <select value={filters.sort} onChange={handleSortChange} className="input-green text-sm">
                <option value="urgency">Urgency</option>
                <option value="needed_by">Needed By</option>
                <option value="frequency">Most Requested</option>
                <option value="priority">Priority Level</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Category</label>
              <select value={filters.bundle} onChange={handleBundleChange} className="input-green text-sm">
                {bundleOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-all w-full">
                <input type="checkbox" id="perishableFilter" checked={filters.perishable} onChange={togglePerishableOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Perishables</span>
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-all w-full">
                <input type="checkbox" id="serviceFilter" checked={filters.service} onChange={toggleServiceOnly} className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Volunteer</span>
              </label>
            </div>
          </div>
        </div>
      </div>

        {/* Needs Grid */}
        {needs.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No needs available</h3>
            <p className="text-gray-600">Check back soon or adjust your filters</p>
          </div>
        ) : (
          <div className="premium-card-grid">
            {needs.map((need) => {
              const remaining = Math.max(0, (need.quantity || 0) - (need.quantity_fulfilled || 0));
              const selectedQty = Math.max(1, Math.min(Number(quantities[need.id] || 1), remaining || 1));
              const indicator = getUrgencyIndicator(need);

              return (
                <div key={need.id} className="card-green p-6 relative group">
                  {/* Urgency Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`${indicator.color} text-xs px-2.5 py-1`}>
                      {indicator.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mb-4 pr-24">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{need.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">{need.description}</p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Category</div>
                      <div className="font-medium text-gray-900">{need.category || 'General'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Needed</div>
                      <div className="font-medium text-gray-900">{formatNeededBy(need.needed_by)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Bundle</div>
                      <div className="font-medium text-gray-900">{(need.bundle_tag || 'other').replace('_', ' ')}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Remaining</div>
                      <div className="font-medium text-gray-900">{remaining} / {need.quantity}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {need.is_perishable === 1 && (
                      <span className="badge-warning text-xs">Perishable</span>
                    )}
                    {need.service_required === 1 && (
                      <span className="badge-teal text-xs">Volunteer Task</span>
                    )}
                    {need.request_count > 0 && (
                      <span className="badge-green text-xs">{need.request_count} requests</span>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Unit Price</div>
                      <div className="text-2xl font-semibold text-gray-900">${Number(need.cost || 0).toFixed(2)}</div>
                    </div>
                    
                    {remaining > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2">
                          <button onClick={() => handleQuantityChange(need.id, -1)} disabled={selectedQty <= 1} className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30">
                            <Minus className="w-4 h-4 text-gray-700" />
                          </button>
                          <span className="text-sm font-semibold text-gray-900 w-8 text-center">{selectedQty}</span>
                          <button onClick={() => handleQuantityChange(need.id, 1)} disabled={selectedQty >= remaining} className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30">
                            <Plus className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                        <button onClick={() => handleAddToBasket(need)} className="btn-green-primary px-4 py-2 text-sm flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  {remaining === 0 && (
                    <div className="mt-4 text-center py-2 bg-gray-100 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Fully Funded</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NeedsList;
