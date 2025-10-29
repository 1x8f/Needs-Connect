import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAllNeeds } from '../services/api';
import {
  Search,
  SlidersHorizontal,
  AlertCircle,
  Building2,
  CheckCircle,
  Sparkles,
  Utensils,
  Shirt,
  Home,
  Heart,
  Package,
  ShoppingCart,
  X,
  GraduationCap,
  HeartPulse
} from 'lucide-react';

const NeedsList = () => {
  const { categorySlug } = useParams();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [addedItems, setAddedItems] = useState({});

  // Category definitions with aliases
  const CATEGORIES = {
    food: {
      name: 'Food & Nutrition',
      description: 'Help provide meals and groceries to those in need',
      icon: <Utensils className="w-8 h-8" strokeWidth={2} />,
      gradient: 'from-blue-400 to-blue-600',
      aliases: ['meals', 'groceries', 'nutrition']
    },
    clothing: {
      name: 'Clothing & Essentials',
      description: 'Donate clothing, shoes, and essential items',
      icon: <Shirt className="w-8 h-8" strokeWidth={2} />,
      gradient: 'from-purple-400 to-purple-600',
      aliases: ['clothes', 'apparel', 'shoes']
    },
    shelter: {
      name: 'Shelter & Housing',
      description: 'Support temporary housing and shelter services',
      icon: <Home className="w-8 h-8" strokeWidth={2} />,
      gradient: 'from-orange-400 to-orange-600',
      aliases: ['housing', 'accommodation']
    },
    education: {
      name: 'Education',
      description: 'Fund school supplies, books, and educational programs',
      icon: <GraduationCap className="w-8 h-8" strokeWidth={2} />,
      gradient: 'from-green-400 to-green-600',
      aliases: ['school', 'learning', 'books', 'supplies', 'university', 'college']
    },
    healthcare: {
      name: 'Healthcare',
      description: 'Provide medical supplies and healthcare support',
      icon: <HeartPulse className="w-8 h-8" strokeWidth={2} />,
      gradient: 'from-red-400 to-red-600',
      aliases: ['medical', 'health', 'medicine']
    },
    other: {
      name: 'Other Causes',
      description: 'Support various community programs and services',
      icon: <Heart className="w-8 h-8" strokeWidth={2} />,
      gradient: 'from-cyan-400 to-cyan-600',
      aliases: []
    },
    all: {
      name: 'All Needs',
      description: 'Browse all available community needs',
      icon: <Package className="w-8 h-8" strokeWidth={2} />,
      gradient: 'from-slate-400 to-slate-600',
      aliases: []
    }
  };

  // Normalize category from database to our category slugs
  const normalizeCategory = (dbCategory) => {
    if (!dbCategory) return 'other';
    
    const normalized = dbCategory.toLowerCase().trim();
    
    // Check for exact match
    if (CATEGORIES[normalized]) return normalized;
    
    // Check for alias match (e.g., "school" -> "education")
    for (const [key, cat] of Object.entries(CATEGORIES)) {
      if (cat.aliases && cat.aliases.some(alias => alias === normalized)) {
        return key;
      }
    }
    
    // Default to 'other' for unmapped categories
    return 'other';
  };

  const currentCategory = CATEGORIES[categorySlug] || CATEGORIES.all;

  useEffect(() => {
    fetchNeeds();
  }, []);

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const response = await getAllNeeds();
      setNeeds(response.needs || []);
      setError(null);
    } catch (err) {
      setError('Failed to load needs. Please try again later.');
      console.error('Error fetching needs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get category icon (with normalization)
  const getCategoryIcon = (category) => {
    const normalized = normalizeCategory(category);
    const iconProps = { className: "w-full h-full", strokeWidth: 1.5 };
    const iconMap = {
      food: <Utensils {...iconProps} />,
      clothing: <Shirt {...iconProps} />,
      shelter: <Home {...iconProps} />,
      education: <GraduationCap {...iconProps} />,
      healthcare: <HeartPulse {...iconProps} />,
      other: <Heart {...iconProps} />
    };
    return iconMap[normalized] || iconMap.other;
  };

  // Get category background gradient (with normalization)
  const getCategoryGradient = (category) => {
    const normalized = normalizeCategory(category);
    const gradientMap = {
      food: 'from-blue-400 to-blue-600',
      clothing: 'from-purple-400 to-purple-600',
      shelter: 'from-orange-400 to-orange-600',
      education: 'from-green-400 to-green-600',
      healthcare: 'from-red-400 to-red-600',
      other: 'from-cyan-400 to-cyan-600'
    };
    return gradientMap[normalized] || 'from-slate-400 to-slate-600';
  };

  // Get organization type display
  const getOrgTypeDisplay = (orgType) => {
    const orgTypeMap = {
      nonprofit: 'Nonprofit Organization',
      school: 'Educational Institution',
      healthcare: 'Healthcare Facility',
      government: 'Government Agency',
      community: 'Community Group',
      religious: 'Religious Organization',
      other: 'Organization'
    };
    return orgTypeMap[orgType] || 'Organization';
  };

  // Get priority info
  const getPriorityInfo = (priority) => {
    if (priority >= 8) {
      return {
        label: 'Urgent',
        badgeClass: 'bg-red-100 text-red-700 border-2 border-red-300',
        dotColor: 'bg-red-500',
        priority: 'urgent'
      };
    } else if (priority >= 5) {
      return {
        label: 'High Priority',
        badgeClass: 'bg-amber-100 text-amber-700 border-2 border-amber-300',
        dotColor: 'bg-amber-500',
        priority: 'high'
      };
    } else {
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300',
        dotColor: 'bg-emerald-500',
        priority: 'normal'
      };
    }
  };

  // Filter and sort needs
  const filteredNeeds = (needs || [])
    .filter(need => {
      // Normalize the need's category from database (e.g., "school" -> "education")
      const normalizedNeedCategory = normalizeCategory(need.category);
      
      // Filter by URL category parameter first
      const matchesURLCategory = categorySlug === 'all' || !categorySlug || normalizedNeedCategory === categorySlug;
      
      const matchesSearch = need.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          need.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || normalizedNeedCategory === categoryFilter;
      
      let matchesPriority = true;
      if (priorityFilter === 'urgent') matchesPriority = need.priority >= 8;
      else if (priorityFilter === 'high') matchesPriority = need.priority >= 5 && need.priority < 8;
      else if (priorityFilter === 'normal') matchesPriority = need.priority < 5;

      return matchesURLCategory && matchesSearch && matchesCategory && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'priority':
          return b.priority - a.priority;
        case 'cost-low':
          return a.cost - b.cost;
        case 'cost-high':
          return b.cost - a.cost;
        case 'funded-most':
          return (b.quantity_fulfilled / b.quantity) - (a.quantity_fulfilled / a.quantity);
        case 'funded-least':
          return (a.quantity_fulfilled / a.quantity) - (b.quantity_fulfilled / b.quantity);
        default:
          return 0;
      }
    });

  // Handle add to basket
  const handleAddToBasket = async (need) => {
    try {
      const basket = JSON.parse(localStorage.getItem('basket') || '[]');
      const existingItem = basket.find(item => item.id === need.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        basket.push({
          id: need.id,
          title: need.title,
          cost: need.cost,
          quantity: 1,
          category: need.category,
          organization: need.org_type
        });
      }

      localStorage.setItem('basket', JSON.stringify(basket));
      window.dispatchEvent(new Event('storage'));
      
      setAddedItems(prev => ({ ...prev, [need.id]: true }));
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [need.id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Error adding to basket:', err);
      alert('Failed to add item to basket. Please try again.');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || priorityFilter !== 'all' || sortBy !== 'newest';

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        
        {/* HERO/HEADER SECTION */}
        <div className="text-center mb-12">
          {/* Title */}
          <h1 className="text-5xl font-bold text-slate-900 mb-3 tracking-tight">
            {currentCategory.name}
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-slate-600 mb-8">
            {currentCategory.description}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search for needs to support..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-12 pr-24 text-base border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
              />
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  showFilters ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {showFilters ? <X className="w-4 h-4" strokeWidth={2} /> : <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />}
                <span className="hidden sm:inline">Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* FILTERS SECTION */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 animate-[slideDown_0.3s_ease-out]">
            {/* Filter Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-700">Refine your search:</span>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            {/* Priority Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button 
                onClick={() => setPriorityFilter('all')}
                className={`px-4 py-2 rounded-full font-medium shadow-sm transition-all duration-200 ${
                  priorityFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                All Priorities
              </button>
              
              <button 
                onClick={() => setPriorityFilter('urgent')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                  priorityFilter === 'urgent'
                    ? 'bg-red-100 text-red-700 border-2 border-red-400'
                    : 'bg-white border-2 border-red-300 text-red-700 hover:bg-red-50'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Urgent
              </button>
              
              <button 
                onClick={() => setPriorityFilter('high')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                  priorityFilter === 'high'
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
                    : 'bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                High
              </button>
              
              <button 
                onClick={() => setPriorityFilter('normal')}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                  priorityFilter === 'normal'
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400'
                    : 'bg-white border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Normal
              </button>
            </div>
            
            {/* Secondary Filters */}
            <div className="flex flex-wrap gap-3">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="food">Food</option>
                <option value="clothing">Clothing</option>
                <option value="shelter">Shelter</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="other">Other</option>
              </select>
              
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="priority">Highest Priority</option>
                <option value="cost-low">Lowest Cost</option>
                <option value="cost-high">Highest Cost</option>
                <option value="funded-most">Most Funded</option>
                <option value="funded-least">Least Funded</option>
              </select>
            </div>
          </div>
        )}

        {/* NEEDS GRID */}
        {loading ? (
          // LOADING STATE - Skeleton Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-slate-200 rounded-lg mb-3 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded-lg mb-4 w-1/2"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 bg-slate-200 rounded-lg w-5/6"></div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full mb-4"></div>
                  <div className="h-12 bg-slate-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // ERROR STATE
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center mb-12">
            <p className="text-red-700 font-semibold">{error}</p>
            <button 
              onClick={fetchNeeds}
              className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        ) : filteredNeeds.length === 0 ? (
          // EMPTY STATE
          <div className="col-span-full">
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center">
              <div className="max-w-md mx-auto">
                <Package className="w-20 h-20 text-slate-300 mx-auto mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  No needs found
                </h3>
                <p className="text-slate-600 mb-6">
                  We couldn't find any needs matching your filters. Try adjusting your search criteria or check back later for new opportunities to help.
                </p>
                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // NEEDS CARDS GRID
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredNeeds.map((need) => {
              const availableQuantity = need.quantity - need.quantity_fulfilled;
              const fundingPercentage = Math.round((need.quantity_fulfilled / need.quantity) * 100);
              const isFullyFunded = availableQuantity === 0;
              const priorityInfo = getPriorityInfo(need.priority);
              const isAdded = addedItems[need.id];
              
              return (
                <Link 
                  to={`/needs/${need.id}`}
                  key={need.id} 
                  className="group block bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                >
                  {/* Image/Icon Area */}
                  <div className={`relative h-56 bg-gradient-to-br ${getCategoryGradient(need.category)} flex items-center justify-center`}>
                    {/* Large Category Icon */}
                    <div className="text-white/30 group-hover:text-white/50 transition-colors duration-300 w-32 h-32 flex items-center justify-center">
                      {getCategoryIcon(need.category)}
                    </div>
                    
                    {/* Priority Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 ${priorityInfo.badgeClass}`}>
                      {priorityInfo.priority === 'urgent' && <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />}
                      {priorityInfo.label}
                    </div>
                    
                    {/* Category Tag */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-slate-700 border border-slate-200 capitalize">
                      {need.category}
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      {need.title}
                    </h3>
                    
                    {/* Organization & Meta */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <Building2 className="w-4 h-4" strokeWidth={2} />
                      <span className="truncate">{getOrgTypeDisplay(need.org_type)}</span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                      {need.description}
                    </p>
                    
                    {/* Funding Progress Section */}
                    <div className="mb-4">
                      {/* Progress Bar */}
                      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${fundingPercentage}%` }}
                        ></div>
                      </div>
                      
                      {/* Progress Text */}
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-slate-900">
                          {need.quantity_fulfilled} of {need.quantity} items
                        </span>
                        <span className="text-slate-600">
                          {fundingPercentage}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Price Display */}
                    <div className="mb-4 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900">${need.cost}</span>
                      <span className="text-sm text-slate-600">per item</span>
                    </div>
                    
                    {/* Action Button */}
                    {!isFullyFunded ? (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToBasket(need);
                        }}
                        disabled={isAdded}
                        className={`w-full h-12 font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle className="w-5 h-5" strokeWidth={2} />
                            Added to Basket ✓
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                            Add to Basket
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="w-full h-12 bg-emerald-100 text-emerald-700 font-semibold rounded-xl border-2 border-emerald-300 flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" strokeWidth={2} />
                        Fully Funded
                      </div>
                    )}
                  </div>
                  
                  {/* Fully Funded Banner */}
                  {isFullyFunded && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-emerald-200 px-6 py-4">
                      <div className="flex items-center justify-center gap-2 text-emerald-700">
                        <Sparkles className="w-5 h-5" strokeWidth={2} />
                        <span className="font-semibold">This need has been met! 🎉</span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Add custom animation for filter dropdown */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NeedsList;
