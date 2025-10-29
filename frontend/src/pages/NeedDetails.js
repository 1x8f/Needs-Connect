import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNeedById } from '../services/api';
import {
  ArrowLeft,
  AlertCircle,
  Tag,
  Building2,
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Heart,
  Package,
  ShoppingCart,
  Share2,
  Shield,
  TrendingUp,
  Minus,
  Plus,
  Utensils,
  Shirt,
  Home,
  BookOpen,
  DollarSign
} from 'lucide-react';

const NeedDetails = () => {
  const { needId } = useParams();
  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToBasket, setAddedToBasket] = useState(false);

  const fetchNeedDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNeedById(needId);
      setNeed(response.need);
      setError(null);
    } catch (err) {
      setError('Failed to load need details');
      console.error('Error fetching need:', err);
    } finally {
      setLoading(false);
    }
  }, [needId]);

  useEffect(() => {
    fetchNeedDetails();
  }, [fetchNeedDetails]);

  // Normalize category from database to our category slugs
  const normalizeCategory = (dbCategory) => {
    if (!dbCategory) return 'other';
    
    const normalized = dbCategory.toLowerCase().trim();
    
    // Category aliases
    const aliases = {
      food: ['meals', 'groceries', 'nutrition'],
      clothing: ['clothes', 'apparel', 'shoes'],
      shelter: ['housing', 'accommodation'],
      education: ['school', 'learning', 'books', 'supplies', 'university', 'college'],
      healthcare: ['medical', 'health', 'medicine']
    };
    
    // Check for exact match
    if (['food', 'clothing', 'shelter', 'education', 'healthcare', 'other'].includes(normalized)) {
      return normalized;
    }
    
    // Check for alias match (e.g., "school" -> "education")
    for (const [key, aliasList] of Object.entries(aliases)) {
      if (aliasList.includes(normalized)) {
        return key;
      }
    }
    
    // Default to 'other' for unmapped categories
    return 'other';
  };

  // Get category icon (with normalization)
  const getCategoryIcon = (category) => {
    const normalized = normalizeCategory(category);
    const iconProps = { className: "w-full h-full", strokeWidth: 1.5 };
    const iconMap = {
      food: <Utensils {...iconProps} />,
      clothing: <Shirt {...iconProps} />,
      shelter: <Home {...iconProps} />,
      education: <BookOpen {...iconProps} />,
      healthcare: <Heart {...iconProps} />,
      other: <Package {...iconProps} />
    };
    return iconMap[normalized] || iconMap.other;
  };

  // Get priority info
  const getPriorityInfo = (priority) => {
    if (priority >= 8) {
      return {
        label: 'Urgent',
        badgeClass: 'bg-red-100 text-red-700 border-2 border-red-300',
        priority: 'urgent'
      };
    } else if (priority >= 5) {
      return {
        label: 'High Priority',
        badgeClass: 'bg-amber-100 text-amber-700 border-2 border-amber-300',
        priority: 'high'
      };
    } else {
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300',
        priority: 'normal'
      };
    }
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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Handle add to basket
  const handleAddToBasket = () => {
    if (!need) return;

    try {
      const basket = JSON.parse(localStorage.getItem('basket') || '[]');
      const existingItem = basket.find(item => item.id === need.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        basket.push({
          id: need.id,
          title: need.title,
          cost: need.cost,
          quantity: quantity,
          category: need.category,
          organization: need.org_type
        });
      }

      localStorage.setItem('basket', JSON.stringify(basket));
      window.dispatchEvent(new Event('storage'));
      
      setAddedToBasket(true);
      setTimeout(() => {
        setAddedToBasket(false);
      }, 2000);
    } catch (err) {
      console.error('Error adding to basket:', err);
      alert('Failed to add item to basket. Please try again.');
    }
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: need?.title,
        text: need?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-600 mt-4 text-lg">Loading need details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !need) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-12 text-center">
            <p className="text-red-700 font-semibold text-lg mb-4">{error || 'Need not found'}</p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableQuantity = need.quantity - need.quantity_fulfilled;
  const fundingPercentage = Math.round((need.quantity_fulfilled / need.quantity) * 100);
  const totalAmount = need.cost * need.quantity;
  const raisedAmount = need.cost * need.quantity_fulfilled;
  const isFullyFunded = availableQuantity === 0;
  const priorityInfo = getPriorityInfo(need.priority);

  return (
    <div className="min-h-screen bg-slate-50 animate-fadeIn">
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-6">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200 hover:gap-3"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          Back to Browse
        </Link>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hero Image Section */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl group">
              <div className={`relative h-96 bg-gradient-to-br from-blue-100 via-cyan-50 to-emerald-50 flex items-center justify-center`}>
                <div className="text-slate-300 group-hover:text-blue-500 transition-colors duration-300 w-32 h-32 flex items-center justify-center">
                  {getCategoryIcon(need.category)}
                </div>
                
                {/* Priority Badge - Floating */}
                <div className={`absolute top-6 right-6 px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 ${priorityInfo.badgeClass} ${priorityInfo.priority === 'urgent' ? 'animate-pulse' : ''}`}>
                  <AlertCircle className="w-5 h-5" strokeWidth={2} />
                  <span>{priorityInfo.label}</span>
                </div>
                
                {/* Category Badge */}
                <div className="absolute bottom-6 left-6 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl text-sm font-semibold text-slate-900 border-2 border-slate-200 shadow-lg flex items-center gap-2 capitalize">
                  <Tag className="w-4 h-4 inline mr-1.5" strokeWidth={2} />
                  {need.category}
                </div>
              </div>
            </div>
            
            {/* Title & Organization Section */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                {need.title}
              </h1>
              
              {/* Organization Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="w-5 h-5" strokeWidth={2} />
                  <span className="font-semibold text-base">{getOrgTypeDisplay(need.org_type)}</span>
                </div>
                
                {/* Verification Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border-2 border-emerald-200 shadow-md">
                  <CheckCircle className="w-4 h-4" strokeWidth={2} />
                  Verified
                </div>
              </div>
              
              {/* Meta Information */}
              <div className="flex flex-wrap gap-6 text-sm text-slate-600 py-4 border-y border-slate-200 my-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" strokeWidth={2} />
                  <span>Created {formatDate(need.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" strokeWidth={2} />
                  <span>Dubai, UAE</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" strokeWidth={2} />
                  <span>{need.quantity_fulfilled} donations</span>
                </div>
              </div>
              
              {/* Story/Description */}
              <div className="mt-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">The Story</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
                    {need.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Impact Section */}
            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 rounded-2xl p-8 border-2 border-blue-200 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" strokeWidth={2} fill="currentColor" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Your Impact
                </h2>
              </div>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                Every item you fund makes a direct impact in our community. Your contribution helps us provide essential {need.category} to those who need it most.
              </p>
              
              {/* Impact Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-emerald-600 mb-2">{need.quantity_fulfilled}</div>
                  <div className="text-sm font-medium text-slate-600">Items Funded</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">${raisedAmount.toLocaleString()}</div>
                  <div className="text-sm font-medium text-slate-600">Total Raised</div>
                </div>
              </div>
            </div>
            
            {/* What Your Donation Provides */}
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">What Your Donation Provides</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Package className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">{need.title}</div>
                      <div className="text-sm text-slate-600">Per item donation</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">${need.cost}</div>
                </div>
              </div>
              
              {/* Total */}
              <div className="mt-8 pt-6 border-t-2 border-slate-300 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xl font-bold text-slate-900">Cost per item:</span>
                <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  ${need.cost}
                </span>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN - Donation Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* Main Donation Card */}
              <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-slate-200">
                
                {/* Funding Progress */}
                <div className="mb-8">
                  
                  {/* Amount Raised */}
                  <div className="text-5xl font-bold text-slate-900 mb-2">
                    ${raisedAmount.toLocaleString()}
                  </div>
                  <div className="text-slate-600 mb-6 text-base">
                    raised of <span className="font-semibold text-slate-900">${totalAmount.toLocaleString()}</span> goal
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-3.5 bg-slate-100 rounded-full overflow-hidden mb-6 shadow-inner">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                    />
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                      </div>
                      <div className="font-bold text-slate-900 text-xl">{need.quantity_fulfilled}</div>
                      <div className="text-slate-600 text-sm">of {need.quantity} items</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" strokeWidth={2} />
                      </div>
                      <div className="font-bold text-slate-900 text-xl">{fundingPercentage}%</div>
                      <div className="text-slate-600 text-sm">funded</div>
                    </div>
                  </div>
                </div>
                
                {/* Price Display */}
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="text-sm text-blue-700 font-medium mb-1">Cost per item</div>
                  <div className="text-3xl font-bold text-blue-900">${need.cost}</div>
                </div>
                
                {/* Quantity Selector */}
                {!isFullyFunded && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Number of items to fund
                    </label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors"
                      >
                        <Minus className="w-5 h-5" strokeWidth={2} />
                      </button>
                      <input 
                        type="number" 
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, availableQuantity)))}
                        min="1"
                        max={availableQuantity}
                        className="flex-1 h-12 text-center text-2xl font-bold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                      <button 
                        onClick={() => setQuantity(Math.min(quantity + 1, availableQuantity))}
                        disabled={quantity >= availableQuantity}
                        className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-slate-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" strokeWidth={2} />
                      </button>
                    </div>
                    <div className="text-sm text-slate-600 mt-2">
                      Total: <span className="font-bold text-slate-900">${(need.cost * quantity).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {/* Add to Basket Button */}
                {!isFullyFunded ? (
                  <button 
                    onClick={handleAddToBasket}
                    disabled={addedToBasket}
                    className={`w-full h-16 font-bold text-lg rounded-xl shadow-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                      addedToBasket
                        ? 'bg-emerald-600 text-white scale-100'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/40 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0'
                    }`}
                  >
                    {addedToBasket ? (
                      <>
                        <CheckCircle className="w-6 h-6" strokeWidth={2} />
                        Added to Basket!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-6 h-6" strokeWidth={2} />
                        Add to Basket
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full h-16 bg-emerald-100 text-emerald-700 font-bold text-lg rounded-xl border-2 border-emerald-300 flex items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6" strokeWidth={2} />
                    Fully Funded! 🎉
                  </div>
                )}
                
                {/* Share Button */}
                <button 
                  onClick={handleShare}
                  className="w-full mt-4 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
                >
                  <Share2 className="w-5 h-5" strokeWidth={2} />
                  Share this need
                </button>
                
                {/* Trust Indicators */}
                <div className="mt-8 pt-6 border-t-2 border-slate-200 space-y-4">
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                    </div>
                    <span>Donation protected</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    </div>
                    <span>Verified organization</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-purple-600" strokeWidth={2} />
                    </div>
                    <span>{need.quantity_fulfilled} items already funded</span>
                  </div>
                </div>
              </div>
              
              {/* Organizer Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-lg border-2 border-slate-200">
                <h3 className="font-bold text-slate-900 mb-5 text-lg">Organizer</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                    {need.manager_username ? need.manager_username[0].toUpperCase() : 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-base mb-1">{need.manager_username || 'Admin'}</div>
                    <div className="text-sm text-slate-600 mb-1">Need Organizer</div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-2.5 text-blue-600 hover:text-white hover:bg-blue-600 font-semibold border-2 border-blue-600 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" strokeWidth={2} />
                  Contact organizer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeedDetails;

