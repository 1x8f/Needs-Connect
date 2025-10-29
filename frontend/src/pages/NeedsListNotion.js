import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllNeeds, addToBasket } from '../services/api';
import { Search, SlidersHorizontal, X, ShoppingCart, Check, TrendingUp } from 'lucide-react';

/**
 * NeedsList Page - Notion/Linear Style
 * Clean, app-like interface with minimal design
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
    totalValue: filteredNeeds.reduce((sum, n) => sum + (n.cost * (n.quantity - n.quantity_fulfilled)), 0)
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: 'bg-orange-50 text-orange-700',
      clothing: 'bg-purple-50 text-purple-700',
      shelter: 'bg-blue-50 text-blue-700',
      education: 'bg-green-50 text-green-700',
      healthcare: 'bg-pink-50 text-pink-700',
      supplies: 'bg-slate-50 text-slate-700'
    };
    return colors[category] || 'bg-slate-50 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Browse Needs</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {stats.total} needs available {stats.urgent > 0 && `• ${stats.urgent} urgent`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500">Total Value</p>
                <p className="text-lg font-bold text-slate-900">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search needs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex gap-6">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="food">Food</option>
                    <option value="clothing">Clothing</option>
                    <option value="shelter">Shelter</option>
                    <option value="education">Education</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="supplies">Supplies</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                {(selectedCategory !== 'all' || selectedPriority !== 'all') && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedPriority('all');
                    }}
                    className="self-end px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-600 mt-4">Loading needs...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : filteredNeeds.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No needs found matching your criteria</p>
            {(searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedPriority('all');
                }}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNeeds.map((need) => {
              const availableQuantity = need.quantity - need.quantity_fulfilled;
              const fundingPercentage = Math.round((need.quantity_fulfilled / need.quantity) * 100);
              const isAdded = addedItems[need.id];
              const currentQuantity = quantities[need.id] || 1;

              return (
                <div
                  key={need.id}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-start gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">{need.title}</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{need.description}</p>
                        </div>
                        <div className="ml-4">
                          <p className="text-2xl font-bold text-slate-900">${need.cost}</p>
                          <p className="text-xs text-slate-500 text-right">each</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getPriorityColor(need.priority)}`}>
                          {need.priority}
                        </span>
                        {need.category && (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getCategoryColor(need.category)}`}>
                            {need.category}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {availableQuantity} of {need.quantity} available
                        </span>
                        <span className="text-xs text-slate-500 ml-auto">
                          {fundingPercentage}% funded
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            fundingPercentage >= 75 ? 'bg-green-500' : 
                            fundingPercentage >= 25 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${fundingPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions */}
                    {availableQuantity > 0 && (
                      <div className="flex items-center gap-3">
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
                          className="w-16 px-2 py-1.5 text-center border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddToBasket(need)}
                          disabled={isAdded}
                          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${
                            isAdded
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4" strokeWidth={2} />
                              Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" strokeWidth={2} />
                              Add
                            </>
                          )}
                        </button>
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
};

export default NeedsList;


