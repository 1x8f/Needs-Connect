import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllNeeds } from '../services/api';
import {
  Utensils,
  Shirt,
  Home,
  GraduationCap,
  HeartPulse,
  Package,
  TrendingUp,
  Heart
} from 'lucide-react';

const CategorySelection = () => {
  const [stats, setStats] = useState({
    totalActiveNeeds: 0,
    itemsFunded: 0,
    totalValue: 0
  });
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);

  const CATEGORIES = [
    {
      id: 'food',
      slug: 'food',
      name: 'Food & Nutrition',
      icon: <Utensils className="w-10 h-10 text-blue-600" strokeWidth={2} />,
      description: 'Help provide meals and groceries to those in need',
      color: 'blue',
      aliases: ['meals', 'groceries', 'nutrition']
    },
    {
      id: 'clothing',
      slug: 'clothing',
      name: 'Clothing & Essentials',
      icon: <Shirt className="w-10 h-10 text-purple-600" strokeWidth={2} />,
      description: 'Donate clothing, shoes, and essential items',
      color: 'purple',
      aliases: ['clothes', 'apparel', 'shoes']
    },
    {
      id: 'shelter',
      slug: 'shelter',
      name: 'Shelter & Housing',
      icon: <Home className="w-10 h-10 text-orange-600" strokeWidth={2} />,
      description: 'Support temporary housing and shelter services',
      color: 'orange',
      aliases: ['housing', 'accommodation']
    },
    {
      id: 'education',
      slug: 'education',
      name: 'Education',
      icon: <GraduationCap className="w-10 h-10 text-green-600" strokeWidth={2} />,
      description: 'Fund school supplies, books, and educational programs',
      color: 'green',
      aliases: ['school', 'learning', 'books', 'supplies', 'university', 'college']
    },
    {
      id: 'healthcare',
      slug: 'healthcare',
      name: 'Healthcare',
      icon: <HeartPulse className="w-10 h-10 text-red-600" strokeWidth={2} />,
      description: 'Provide medical supplies and healthcare support',
      color: 'red',
      aliases: ['medical', 'health', 'medicine']
    },
    {
      id: 'other',
      slug: 'other',
      name: 'Other Causes',
      icon: <Heart className="w-10 h-10 text-cyan-600" strokeWidth={2} />,
      description: 'Support various community programs and services',
      color: 'cyan',
      aliases: []
    },
  ];

  // Normalize category from database to our category slugs
  const normalizeCategory = (dbCategory) => {
    if (!dbCategory) return 'other';
    
    const normalized = dbCategory.toLowerCase().trim();
    
    // Check for exact match
    const exactMatch = CATEGORIES.find(cat => cat.slug === normalized);
    if (exactMatch) return exactMatch.slug;
    
    // Check for alias match (e.g., "school" -> "education")
    const aliasMatch = CATEGORIES.find(cat => 
      cat.aliases && cat.aliases.some(alias => alias === normalized)
    );
    if (aliasMatch) return aliasMatch.slug;
    
    // Default to 'other' for unmapped categories
    return 'other';
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllNeeds();
      const needs = response.needs || [];
      
      // Calculate overall stats
      const totalActiveNeeds = needs.length;
      const totalValue = needs.reduce((sum, need) => sum + (need.cost * need.quantity), 0);
      const itemsFunded = needs.reduce((sum, need) => sum + need.quantity_fulfilled, 0);
      
      setStats({
        totalActiveNeeds,
        itemsFunded,
        totalValue
      });
      
      // Calculate per-category stats (with normalization)
      const categoryData = {};
      CATEGORIES.forEach(cat => {
        const categoryNeeds = needs.filter(need => normalizeCategory(need.category) === cat.id);
        categoryData[cat.id] = {
          needCount: categoryNeeds.length,
          totalValue: categoryNeeds.reduce((sum, need) => sum + (need.cost * need.quantity), 0)
        };
      });
      setCategoryStats(categoryData);
      
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-12 text-center">
        
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
          Choose Your Cause
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Select a category to discover needs from organizations making a difference in their communities
        </p>
        
        {/* Stats Bar */}
        {!loading && (
          <div className="flex items-center justify-center gap-8 flex-wrap mb-12">
            <div className="flex items-center gap-2 text-slate-700">
              <TrendingUp className="w-5 h-5 text-emerald-600" strokeWidth={2} />
              <span className="font-semibold">{stats.totalActiveNeeds} Active Needs</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Package className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <span className="font-semibold">{stats.itemsFunded} Items Funded</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Heart className="w-5 h-5 text-red-500" strokeWidth={2} fill="currentColor" />
              <span className="font-semibold">${stats.totalValue.toLocaleString()} Total Value</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Category Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Browse by Category</h2>
          <p className="text-slate-600 text-lg">Choose the cause that matters most to you</p>
        </div>
        
        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-8 animate-pulse">
                <div className="w-20 h-20 mx-auto mb-6 bg-slate-200 rounded-2xl"></div>
                <div className="h-6 bg-slate-200 rounded-lg mb-2"></div>
                <div className="h-4 bg-slate-200 rounded-lg w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Grid of Category Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              
              {CATEGORIES.map((category) => {
                const catStats = categoryStats[category.id] || { needCount: 0, totalValue: 0 };
                
                return (
                  <Link 
                    key={category.id}
                    to={`/browse/category/${category.slug}`}
                    className="group"
                  >
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 md:p-8 hover:border-blue-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full flex flex-col">
                      
                      {/* Icon Container */}
                      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center shadow-md">
                        {category.icon}
                      </div>
                      
                      {/* Category Name */}
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 text-center group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                );
              })}
              
            </div>
            
            {/* Browse All */}
            <div className="text-center mt-12">
              <Link 
                to="/browse/category/all"
                className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
              >
                <Package className="w-5 h-5" strokeWidth={2} />
                Browse All Needs
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CategorySelection;

