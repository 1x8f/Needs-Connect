import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllNeeds, addToBasket } from '../services/api';
import { Search, SlidersHorizontal, ShoppingCart, Check, AlertCircle, TrendingUp, Users, DollarSign, Heart } from 'lucide-react';

/**
 * NeedsList Page - Feed/Timeline Style
 * Story-driven scrolling experience
 */
const NeedsList = () => {
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Basket state
  const [quantities, setQuantities] = useState({});
  const [addedItems, setAddedItems] = useState({});

  // Fetch needs on component mount
  useEffect(() => {
    fetchNeeds();
  }, []);

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const response = await getAllNeeds();
      if (response.success) {
        setNeeds(response.needs);
      } else {
        setError(response.message || 'Failed to load needs');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Filter needs
  const filteredNeeds = needs.filter(need => {
    const matchesSearch = need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || need.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || need.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Calculate stats
  const stats = {
    total: filteredNeeds.length,
    urgent: filteredNeeds.filter(n => n.priority === 'urgent').length,
    totalValue: filteredNeeds.reduce((sum, n) => sum + (n.cost * (n.quantity - n.quantity_fulfilled)), 0),
    peopleHelped: filteredNeeds.reduce((sum, n) => sum + n.quantity_fulfilled, 0)
  };

  // Handle Add to Basket
  const handleAddToBasket = async (need) => {
    const quantity = quantities[need.id] || 1;
    
    try {
      const response = await addToBasket({
        user_id: user.id,
        need_id: need.id,
        quantity: quantity
      });

      if (response.success) {
        setAddedItems(prev => ({ ...prev, [need.id]: true }));
        setTimeout(() => {
          setAddedItems(prev => ({ ...prev, [need.id]: false }));
          setQuantities(prev => ({ ...prev, [need.id]: 1 }));
        }, 2000);
      } else {
        alert(response.message || 'Failed to add to basket');
      }
    } catch (err) {
      alert('Failed to add to basket. Please try again.');
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'bg-red-50 border-red-200 text-red-700',
          icon: <AlertCircle className="w-4 h-4" strokeWidth={2} />,
          label: 'Urgent Need'
        };
      case 'high':
        return {
          color: 'bg-orange-50 border-orange-200 text-orange-700',
          icon: <TrendingUp className="w-4 h-4" strokeWidth={2} />,
          label: 'High Priority'
        };
      case 'medium':
        return {
          color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
          icon: <TrendingUp className="w-4 h-4" strokeWidth={2} />,
          label: 'Medium Priority'
        };
      default:
        return {
          color: 'bg-slate-50 border-slate-200 text-slate-600',
          icon: <TrendingUp className="w-4 h-4" strokeWidth={2} />,
          label: 'Normal'
        };
    }
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      food: '🍽️',
      clothing: '👕',
      shelter: '🏠',
      education: '📚',
      healthcare: '🏥',
      supplies: '📦'
    };
    return emojis[category] || '💝';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Community Needs</h1>
          <p className="text-slate-600">Help make a difference, one need at a time</p>
          
          {/* Search Bar */}
          <div className="mt-6 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search for needs to support..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none text-sm bg-slate-50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 border rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
              Filter
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="food">🍽️ Food</option>
                    <option value="clothing">👕 Clothing</option>
                    <option value="shelter">🏠 Shelter</option>
                    <option value="education">📚 Education</option>
                    <option value="healthcare">🏥 Healthcare</option>
                    <option value="supplies">📦 Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">🚨 Urgent</option>
                    <option value="high">⚡ High</option>
                    <option value="medium">📍 Medium</option>
                    <option value="low">💡 Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Heart className="w-4 h-4" strokeWidth={2} />
                <p className="text-xs font-semibold uppercase tracking-wide">Active Needs</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Users className="w-4 h-4" strokeWidth={2} />
                <p className="text-xs font-semibold uppercase tracking-wide">People Helped</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.peopleHelped}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <DollarSign className="w-4 h-4" strokeWidth={2} />
                <p className="text-xs font-semibold uppercase tracking-wide">Total Value</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-600 mt-4">Loading community needs...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" strokeWidth={2} />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : filteredNeeds.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 text-lg mb-2">No needs found</p>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNeeds.map((need) => {
              const availableQuantity = need.quantity - need.quantity_fulfilled;
              const fundingPercentage = Math.round((need.quantity_fulfilled / need.quantity) * 100);
              const isAdded = addedItems[need.id];
              const currentQuantity = quantities[need.id] || 1;
              const priorityConfig = getPriorityConfig(need.priority);

              return (
                <article
                  key={need.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-300"
                >
                  {/* Priority Banner */}
                  {need.priority === 'urgent' && (
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 flex items-center gap-2 text-white">
                      <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
                      <p className="font-bold text-sm uppercase tracking-wide">Urgent Need - Immediate Help Required</p>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                          {getCategoryEmoji(need.category)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{need.title}</h2>
                          <p className="text-sm text-slate-500 capitalize mt-0.5">{need.category} • {need.org_type?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      {need.priority !== 'urgent' && (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${priorityConfig.color}`}>
                          {priorityConfig.icon}
                          {priorityConfig.label}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-slate-700 leading-relaxed mb-6 text-base">
                      {need.description || 'Help us support those in need with this essential item.'}
                    </p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1 font-medium">Price per item</p>
                        <p className="text-3xl font-bold text-slate-900">${need.cost}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1 font-medium">Available</p>
                        <p className="text-3xl font-bold text-slate-900">{availableQuantity}</p>
                        <p className="text-xs text-slate-500">of {need.quantity}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1 font-medium">Funded</p>
                        <p className="text-3xl font-bold text-slate-900">{fundingPercentage}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-700">Funding Progress</p>
                        <p className="text-sm text-slate-600">
                          <span className="font-bold text-slate-900">{need.quantity_fulfilled}</span> / {need.quantity} items funded
                        </p>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ${
                            fundingPercentage >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                            fundingPercentage >= 25 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                            'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${fundingPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Section */}
                    {availableQuantity > 0 ? (
                      <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-semibold text-slate-700">Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            max={availableQuantity}
                            value={currentQuantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setQuantities(prev => ({
                                ...prev,
                                [need.id]: Math.max(1, Math.min(val, availableQuantity))
                              }));
                            }}
                            className="w-20 px-3 py-2 text-center border-2 border-slate-200 rounded-lg text-base font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                          />
                          <span className="text-sm text-slate-600">
                            Total: <span className="font-bold text-slate-900">${(need.cost * currentQuantity).toFixed(2)}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToBasket(need)}
                          disabled={isAdded}
                          className={`ml-auto px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 text-base shadow-lg ${
                            isAdded
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white scale-105'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-xl hover:scale-105'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-5 h-5" strokeWidth={2.5} />
                              Added to Basket!
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                              Add to Basket
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-6 border-t border-slate-200">
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                          <Check className="w-8 h-8 text-green-600 mx-auto mb-2" strokeWidth={2.5} />
                          <p className="text-green-800 font-bold">Fully Funded!</p>
                          <p className="text-green-700 text-sm mt-1">This need has been met by our amazing community 🎉</p>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NeedsList;

