import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllNeeds, addToBasket } from '../services/api';
import { Search, ShoppingCart, Package, TrendingUp, Building2, DollarSign, Plus, Minus, X, Grid3x3, SlidersHorizontal, Sparkles } from 'lucide-react';

/**
 * NeedsList Page - Left Sidebar Filter Design
 * Professional layout with sidebar filters and card grid
 */
function NeedsList() {
  const { user } = useAuth();
  
  // Data states
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilters, setCategoryFilters] = useState([]); // Multiple categories
  const [sortBy, setSortBy] = useState('newest');

  // UI states
  const [addedItems, setAddedItems] = useState({});
  const [quantities, setQuantities] = useState({});
  const [animateStats, setAnimateStats] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch needs on component load
  useEffect(() => {
    fetchNeeds();
  }, []);

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllNeeds();
      
      if (response.success) {
        setNeeds(response.needs);
        // Initialize quantities to 1 for each need
        const initialQuantities = {};
        response.needs.forEach(need => {
          initialQuantities[need.id] = 1;
        });
        setQuantities(initialQuantities);
        // Trigger stats animation
        setTimeout(() => setAnimateStats(true), 100);
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

  // Handle quantity change
  const handleQuantityChange = (needId, change) => {
    setQuantities(prev => {
      const currentQty = prev[needId] || 1;
      const newQty = Math.max(1, currentQty + change);
      const need = needs.find(n => n.id === needId);
      const maxQty = need ? need.quantity - need.quantity_fulfilled : 999;
      return {
        ...prev,
        [needId]: Math.min(newQty, maxQty)
      };
    });
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
        console.error('Failed to add to basket:', response.message);
        alert(response.message || 'Failed to add to basket');
      }
    } catch (err) {
      console.error('Error adding to basket:', err);
      alert('Failed to add to basket. Please try again.');
    }
  };

  // Toggle category filter
  const toggleCategory = (category) => {
    setCategoryFilters(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Filter and sort needs
  const filteredNeeds = needs
    .filter(need => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          need.title?.toLowerCase().includes(search) ||
          need.description?.toLowerCase().includes(search) ||
          need.manager_username?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .filter(need => {
      if (priorityFilter === 'all') return true;
      return need.priority === priorityFilter;
    })
    .filter(need => {
      if (categoryFilters.length === 0) return true;
      return categoryFilters.includes(need.category?.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.id - a.id;
        case 'priority':
          const priorityOrder = { urgent: 3, high: 2, normal: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'cost-low':
          return a.cost - b.cost;
        case 'cost-high':
          return b.cost - a.cost;
        default:
          return 0;
      }
    });

  // Calculate stats
  const activeNeeds = needs.length;
  const totalValue = needs.reduce((sum, need) => {
    const available = need.quantity - need.quantity_fulfilled;
    return sum + (need.cost * available);
  }, 0);
  const uniqueOrgs = new Set(needs.map(need => need.manager_username)).size;

  // Calculate category counts
  const categoryCounts = needs.reduce((acc, need) => {
    const cat = need.category?.toLowerCase() || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Calculate priority counts
  const priorityCounts = needs.reduce((acc, need) => {
    acc[need.priority] = (acc[need.priority] || 0) + 1;
    return acc;
  }, {});

  // Check if filters are active
  const hasActiveFilters = searchTerm || priorityFilter !== 'all' || categoryFilters.length > 0 || sortBy !== 'newest';
  const activeFilterCount = [
    priorityFilter !== 'all',
    categoryFilters.length > 0,
    sortBy !== 'newest'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('all');
    setCategoryFilters([]);
    setSortBy('newest');
  };

  // Remove individual filter
  const removeFilter = (type, value) => {
    if (type === 'priority') setPriorityFilter('all');
    if (type === 'category') setCategoryFilters(prev => prev.filter(c => c !== value));
    if (type === 'sort') setSortBy('newest');
  };

  // Helper functions
  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-amber-100 text-amber-700 border-amber-300',
      normal: 'bg-green-100 text-green-700 border-green-300'
    };
    return styles[priority] || styles.normal;
  };

  const getPriorityBorder = (priority) => {
    const colors = {
      urgent: 'border-l-red-500',
      high: 'border-l-amber-500',
      normal: 'border-l-green-500'
    };
    return colors[priority] || colors.normal;
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: 'bg-orange-100 text-orange-700 border-orange-300',
      clothing: 'bg-purple-100 text-purple-700 border-purple-300',
      shelter: 'bg-blue-100 text-blue-700 border-blue-300',
      education: 'bg-green-100 text-green-700 border-green-300',
      healthcare: 'bg-pink-100 text-pink-700 border-pink-300',
      supplies: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[category?.toLowerCase()] || 'bg-blue-100 text-blue-700 border-blue-300';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const popularSearches = ['Food', 'Urgent', 'Clothing', 'Healthcare', 'Shelter'];
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Count-up animation hook with initial 0 state
  const useCountUp = (end, duration = 1000) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    
    useEffect(() => {
      // Don't start until we have a valid end value and animation is ready
      if (end === 0 || hasStarted) return;
      
      // Small delay to ensure smooth start
      const delayTimer = setTimeout(() => {
        setHasStarted(true);
        let startTime;
        
        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          setCount(Math.floor(progress * end));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      }, 100);
      
      return () => clearTimeout(delayTimer);
    }, [end, duration, hasStarted]);
    
    return count;
  };

  // Animated stats values - always start from 0
  const animatedActiveNeeds = useCountUp(activeNeeds, 1000);
  const animatedTotalValue = useCountUp(totalValue, 1200);
  const animatedUniqueOrgs = useCountUp(uniqueOrgs, 800);

  // Search suggestions based on input
  useEffect(() => {
    if (searchTerm && searchTerm.length > 1) {
      const suggestions = needs
        .filter(need => 
          need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          need.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5)
        .map(need => need.title);
      setSearchSuggestions([...new Set(suggestions)]);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, needs]);

  // Mock activity feed data with amounts
  const [activityFeed, setActivityFeed] = useState([
    { id: 1, type: 'funded', user: 'Sarah M.', item: 'Winter Coats', time: '2 mins ago', icon: '🎉', amount: 45 },
    { id: 2, type: 'viewing', user: '5 people', item: 'Chicken Piece', time: 'now', icon: '👀', amount: 0 },
    { id: 3, type: 'completed', user: 'John D.', item: 'Rice - 50kg bags', time: '8 mins ago', icon: '✅', amount: 150 },
    { id: 4, type: 'funded', user: 'Maria K.', item: 'School Supplies', time: '15 mins ago', icon: '🎉', amount: 80 },
  ]);

  // Calculate today's impact from activity feed
  const todaysImpact = {
    donations: activityFeed.filter(a => a.type === 'funded' || a.type === 'completed').length,
    amountRaised: activityFeed.reduce((sum, a) => sum + (a.amount || 0), 0),
    activeHelpers: new Set(activityFeed.map(a => a.user)).size + Math.floor(Math.random() * 20) // Add some randomness
  };

  // Simulate live activity (add new activity every 30 seconds)
  useEffect(() => {
    const activities = [
      { type: 'funded', users: ['Alex R.', 'Emma S.', 'Chris T.', 'Linda P.'], icon: '🎉' },
      { type: 'viewing', users: ['2 people', '3 people', '4 people'], icon: '👀' },
      { type: 'completed', users: ['David M.', 'Sophie L.', 'Mike B.'], icon: '✅' },
    ];

    const interval = setInterval(() => {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      const randomUser = randomActivity.users[Math.floor(Math.random() * randomActivity.users.length)];
      const randomItem = needs.length > 0 ? needs[Math.floor(Math.random() * needs.length)].title : 'Various Items';
      const randomAmount = randomActivity.type !== 'viewing' ? Math.floor(Math.random() * 100) + 20 : 0;
      
      const newActivity = {
        id: Date.now(),
        type: randomActivity.type,
        user: randomUser,
        item: randomItem,
        time: 'just now',
        icon: randomActivity.icon,
        amount: randomAmount
      };

      setActivityFeed(prev => [newActivity, ...prev.slice(0, 3)]); // Keep only 4 activities
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [needs]);

  // Get activity color
  const getActivityColor = (type) => {
    const colors = {
      funded: 'bg-green-50 border-green-200 text-green-700',
      viewing: 'bg-blue-50 border-blue-200 text-blue-700',
      completed: 'bg-purple-50 border-purple-200 text-purple-700',
      urgent: 'bg-red-50 border-red-200 text-red-700'
    };
    return colors[type] || 'bg-slate-50 border-slate-200 text-slate-700';
  };

  // Sidebar Filter Component
  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'p-6' : ''}`}>
      {/* Priority Filter */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Priority</h3>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All', count: needs.length },
            { value: 'urgent', label: 'Urgent', count: priorityCounts.urgent || 0 },
            { value: 'high', label: 'High', count: priorityCounts.high || 0 },
            { value: 'normal', label: 'Normal', count: priorityCounts.normal || 0 }
          ].map(({ value, label, count }) => (
            <label
              key={value}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${
                priorityFilter === value ? 'bg-blue-50 border-2 border-blue-500' : 'border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="priority"
                  value={value}
                  checked={priorityFilter === value}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Category</h3>
        <div className="space-y-2">
          {['food', 'clothing', 'shelter', 'education', 'healthcare', 'supplies'].map(category => {
            const count = categoryCounts[category] || 0;
            if (count === 0) return null;
            return (
              <label
                key={category}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${
                  categoryFilters.includes(category) ? 'bg-blue-50 border-2 border-blue-500' : 'border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={categoryFilters.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-slate-700 capitalize">{category}</span>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm font-medium"
        >
          <option value="newest">Newest First</option>
          <option value="priority">Highest Priority</option>
          <option value="cost-low">Lowest Cost</option>
          <option value="cost-high">Highest Cost</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-all"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4 text-center">
            Browse Needs
          </h1>
          <p className="text-xl text-slate-600 mb-8 text-center">
            Make a difference by supporting non-profit organizations
          </p>

          {/* Stats Bar - Animated Count-Up */}
          <div className="flex gap-6 items-center justify-center flex-wrap">
            <div className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl px-8 py-5 border-2 border-green-200 flex items-center gap-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <TrendingUp className="w-7 h-7 text-green-600" strokeWidth={2.5} />
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums min-w-[60px]">
                  {animatedActiveNeeds}
                </p>
                <p className="text-sm text-green-700 font-semibold">Active Needs</p>
              </div>
            </div>

            <div className={`bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl px-8 py-5 border-2 border-blue-200 flex items-center gap-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
              <Building2 className="w-7 h-7 text-blue-600" strokeWidth={2.5} />
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums min-w-[60px]">
                  {animatedUniqueOrgs}
                </p>
                <p className="text-sm text-blue-700 font-semibold">Organizations</p>
              </div>
            </div>

            <div className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl px-8 py-5 border-2 border-purple-200 flex items-center gap-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
              <DollarSign className="w-7 h-7 text-purple-600" strokeWidth={2.5} />
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums min-w-[80px]">
                  ${animatedTotalValue.toLocaleString()}
                </p>
                <p className="text-sm text-purple-700 font-semibold">Total Value</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebars */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="flex gap-6">
          {/* LEFT SIDEBAR - Desktop Only */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* CENTER CONTENT AREA */}
          <div className="flex-1 min-w-0">
            {/* Search Bar with Suggestions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search needs by title, description, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl z-10 max-h-64 overflow-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchTerm(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-all flex items-center gap-2 text-sm border-b border-slate-100 last:border-0"
                      >
                        <Sparkles className="w-4 h-4 text-blue-500" strokeWidth={2} />
                        <span className="font-medium text-slate-900">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Searches */}
              {!searchTerm && (
                <div className="flex gap-2 items-center flex-wrap">
                  {popularSearches.map(search => (
                    <button
                      key={search}
                      onClick={() => setSearchTerm(search)}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-full transition-all duration-200 font-medium"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Filters Button */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center gap-2 font-semibold text-slate-900 hover:border-blue-500 transition-all"
              >
                <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filters Chips */}
            {hasActiveFilters && (
              <div className="mb-6 flex gap-2 items-center flex-wrap">
                <span className="text-sm font-semibold text-slate-700">Active:</span>
                {priorityFilter !== 'all' && (
                  <button
                    onClick={() => removeFilter('priority')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-all"
                  >
                    <span className="capitalize">{priorityFilter}</span>
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                )}
                {categoryFilters.map(cat => (
                  <button
                    key={cat}
                    onClick={() => removeFilter('category', cat)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-all"
                  >
                    <span className="capitalize">{cat}</span>
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                ))}
                {sortBy !== 'newest' && (
                  <button
                    onClick={() => removeFilter('sort')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-all"
                  >
                    <span>
                      {sortBy === 'priority' ? 'Priority' : sortBy === 'cost-low' ? 'Low Cost' : 'High Cost'}
                    </span>
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                )}
              </div>
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-slate-600">
                Showing <span className="font-bold text-slate-900">{filteredNeeds.length}</span> of <span className="font-bold text-slate-900">{needs.length}</span> needs
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-blue-600 text-white rounded-lg">
                  <Grid3x3 className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl border-2 border-slate-200 p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-6"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-6"></div>
                    <div className="h-8 bg-slate-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            {/* Empty State - Enhanced */}
            {!loading && !error && filteredNeeds.length === 0 && (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border-2 border-dashed border-slate-300 p-16 text-center shadow-lg">
                <div className="relative inline-block mb-6">
                  <Package className="w-20 h-20 text-slate-400 animate-pulse" strokeWidth={1.5} />
                  <div className="absolute -top-2 -right-2">
                    <Search className="w-8 h-8 text-blue-400" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {hasActiveFilters ? 'No needs match your filters' : 'No needs available at the moment'}
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  {hasActiveFilters ? 'We couldn\'t find any needs matching your criteria. Try adjusting your filters or search terms to discover more opportunities to help.' : 'Check back soon for new opportunities to help'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            {/* Needs Grid - Enhanced 4-column layout */}
            {!loading && !error && filteredNeeds.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredNeeds.map((need) => {
                  const availableQuantity = need.quantity - need.quantity_fulfilled;
                  const fundingPercentage = Math.round((need.quantity_fulfilled / need.quantity) * 100);
                  const isAdded = addedItems[need.id];
                  const currentQuantity = quantities[need.id] || 1;
                  const isUrgent = need.priority === 'urgent';

                  // Get organization type display name
                  const getOrgTypeDisplay = (orgType) => {
                    const types = {
                      food_bank: 'Food Bank',
                      animal_shelter: 'Animal Shelter',
                      hospital: 'Hospital',
                      school: 'School',
                      homeless_shelter: 'Homeless Shelter',
                      community_center: 'Community Center',
                      disaster_relief: 'Disaster Relief',
                      other: 'Non-Profit Organization'
                    };
                    return types[orgType] || 'Non-Profit Organization';
                  };

                  return (
                    <div
                      key={need.id}
                      className={`group relative bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-6 shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-l-4 ${getPriorityBorder(need.priority)} ${
                        isUrgent ? 'animate-pulse-border ring-2 ring-red-200' : ''
                      }`}
                    >
                      {/* Title */}
                      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                        {need.title}
                      </h3>

                      {/* Organization Type */}
                      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                        <span className="font-semibold">{getOrgTypeDisplay(need.org_type)}</span>
                        {need.category && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{need.category}</span>
                          </>
                        )}
                      </p>

                      {/* Description */}
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                        {need.description || 'No description provided'}
                      </p>

                      {/* Cost */}
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-slate-900">${need.cost}</span>
                        <span className="text-sm text-slate-500 ml-1">each</span>
                      </div>

                      {/* Progress Bar - Enhanced with glow */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-slate-600">{availableQuantity} available</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            fundingPercentage >= 75 
                              ? 'text-green-700 bg-green-100' 
                              : fundingPercentage >= 25 
                              ? 'text-amber-700 bg-amber-100' 
                              : 'text-red-700 bg-red-100'
                          }`}>
                            {fundingPercentage}%
                          </span>
                        </div>
                        <div className="relative w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${getProgressColor(fundingPercentage)} ${
                              fundingPercentage >= 75 
                                ? 'shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                                : fundingPercentage >= 25 
                                ? 'shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                                : 'shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                            }`}
                            style={{ width: `${fundingPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Quantity Input + Add to Basket */}
                      {availableQuantity > 0 ? (
                        <div className="space-y-2.5">
                          {/* Quantity Input - Enhanced */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(need.id, -1)}
                              disabled={currentQuantity <= 1}
                              className="w-10 h-10 flex items-center justify-center border-2 border-slate-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Minus className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
                            </button>
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
                              className="flex-1 h-10 text-center text-lg font-bold text-slate-900 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all bg-white"
                            />
                            <button
                              onClick={() => handleQuantityChange(need.id, 1)}
                              disabled={currentQuantity >= availableQuantity}
                              className="w-10 h-10 flex items-center justify-center border-2 border-slate-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Plus className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
                            </button>
                          </div>

                          {/* Total Price */}
                          <div className="text-center text-sm text-slate-600 bg-slate-50 rounded-lg py-2">
                            Total: <span className="font-extrabold text-lg text-slate-900">${(need.cost * currentQuantity).toFixed(2)}</span>
                          </div>

                          {/* Add to Basket Button - Enhanced */}
                          <button
                            onClick={() => handleAddToBasket(need)}
                            disabled={isAdded}
                            className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                              isAdded
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white shadow-md hover:shadow-xl'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <span>✓</span>
                                <span>Added to Basket!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                                <span>Add to Basket</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-lg font-semibold bg-slate-300 text-slate-500 cursor-not-allowed text-sm"
                        >
                          Fully Funded
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Activity Feed - Desktop Only */}
          <aside className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              {/* Live Activity Feed - Enhanced */}
              <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border-2 border-blue-200 p-6 shadow-lg mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">Live Activity</h2>
                  <div className="flex items-center gap-2 bg-green-100 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-700 font-bold">Live</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {activityFeed.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${getActivityColor(activity.type)}`}
                      style={{
                        animation: index === 0 ? 'slideIn 0.5s ease-out' : 'none'
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{activity.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 mb-1 leading-tight">
                            {activity.user}
                            {activity.type === 'funded' && ' funded'}
                            {activity.type === 'viewing' && ' viewing'}
                            {activity.type === 'completed' && ' completed'}
                            {activity.type === 'urgent' && ' needs attention'}
                          </p>
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {activity.item}
                          </p>
                          <p className="text-xs text-slate-500 mt-1.5 font-medium">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats - Enhanced with gradients */}
              <div className="bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 rounded-2xl border-2 border-purple-200 p-6 shadow-lg">
                <h3 className="text-base font-extrabold text-slate-900 mb-5 uppercase tracking-wide">Today's Impact</h3>
                <div className="space-y-4">
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between border border-blue-200 hover:scale-105 transition-all duration-200">
                    <span className="text-sm font-semibold text-slate-700">Donations</span>
                    <span className="text-2xl font-extrabold text-blue-600 tabular-nums">{todaysImpact.donations}</span>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between border border-purple-200 hover:scale-105 transition-all duration-200">
                    <span className="text-sm font-semibold text-slate-700">Amount Raised</span>
                    <span className="text-2xl font-extrabold text-purple-600 tabular-nums">${todaysImpact.amountRaised}</span>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between border border-green-200 hover:scale-105 transition-all duration-200">
                    <span className="text-sm font-semibold text-slate-700">Active Users</span>
                    <span className="text-2xl font-extrabold text-green-600 tabular-nums">{todaysImpact.activeHelpers}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)}></div>
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-slate-600" strokeWidth={2} />
              </button>
            </div>
            <FilterSidebar isMobile={true} />
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              >
                View {filteredNeeds.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NeedsList;
