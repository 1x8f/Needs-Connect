import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllNeeds, deleteNeed } from '../services/api';

/**
 * Manager Dashboard (Cupboard) - Manage needs
 * Managers can view, add, edit, and delete their needs
 */
function ManagerDashboard() {
  const { user } = useAuth();
  
  // State management
  const [needs, setNeeds] = useState([]);
  const [error, setError] = useState(null);
  const [deleteMessages, setDeleteMessages] = useState({}); // Track delete messages per need
  const [filters, setFilters] = useState({
    sort: 'urgency',
    timeSensitiveOnly: true,
    perishableOnly: false,
    bundle: 'all'
  });
  const [summary, setSummary] = useState({
    urgent: 0,
    perishable: 0,
    service: 0
  });

  // Fetch needs belonging to this manager
  const fetchManagerNeeds = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      const queryFilters = {
        managerId: user.id,
        sort: filters.sort
      };

      if (filters.timeSensitiveOnly) {
        queryFilters.timeSensitiveOnly = true;
      }
      if (filters.perishableOnly) {
        queryFilters.perishable = true;
      }
      if (filters.bundle && filters.bundle !== 'all') {
        queryFilters.bundle = filters.bundle;
      }

      const response = await getAllNeeds(queryFilters);

      if (response.success) {
        const managerNeeds = (response.needs || []).filter(
          need => need.manager_username === user.username
        );
        setNeeds(managerNeeds);

        const urgentCount = managerNeeds.filter(need => (need.urgency_score || 0) >= 70 || (need.due_in_days !== null && need.due_in_days <= 3)).length;
        const perishableCount = managerNeeds.filter(need => need.is_perishable).length;
        const serviceCount = managerNeeds.filter(need => need.service_required).length;

        setSummary({
          urgent: urgentCount,
          perishable: perishableCount,
          service: serviceCount
        });
      } else {
        setError('Failed to load needs');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching needs:', err);
    }
  }, [filters, user]);

  // Fetch manager's needs on component load
  useEffect(() => {
    fetchManagerNeeds();
  }, [fetchManagerNeeds]);

  // Handle delete need
  const handleDeleteNeed = async (needId, needTitle) => {
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete "${needTitle}"?\n\nThis will:\n- Remove the need permanently\n- Remove it from any helper's baskets\n- Cannot be undone!`)) {
      return;
    }

    // Start loading state
    setDeleteMessages(prev => ({
      ...prev,
      [needId]: { type: 'loading', text: 'Deleting...' }
    }));

    try {
      const response = await deleteNeed(needId);

      if (response.success) {
        // Success! Remove from local state
        setNeeds(prev => prev.filter(need => need.id !== needId));
        
        // Success message that auto-clears
        setDeleteMessages(prev => ({
          ...prev,
          [needId]: { type: 'success', text: 'Deleted successfully!' }
        }));
        
        // Clear message after 2 seconds
        setTimeout(() => {
          setDeleteMessages(prev => {
            const updated = { ...prev };
            delete updated[needId];
            return updated;
          });
        }, 2000);

        // Notify other tabs
        window.dispatchEvent(new CustomEvent('needs-updated'));
      } else {
        // Error message
        setDeleteMessages(prev => ({
          ...prev,
          [needId]: { type: 'error', text: response.message || 'Failed to delete' }
        }));
        
        // Clear error after 3 seconds
        setTimeout(() => {
          setDeleteMessages(prev => {
            const updated = { ...prev };
            delete updated[needId];
            return updated;
          });
        }, 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteMessages(prev => ({
        ...prev,
        [needId]: { type: 'error', text: 'Network error' }
      }));
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setDeleteMessages(prev => {
          const updated = { ...prev };
          delete updated[needId];
          return updated;
        });
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  const getUrgencyIndicator = (need) => {
    const score = need.urgency_score || 0;
    const dueIn = need.due_in_days;

    if (score >= 80 || (dueIn !== null && dueIn <= 0)) {
      return { label: 'Critical', tone: 'badge-urgent' };
    }
    if (score >= 60 || (dueIn !== null && dueIn <= 3)) {
      return { label: 'High', tone: 'badge-warning' };
    }
    if (score >= 40) {
      return { label: 'Medium', tone: 'badge-green' };
    }
    return { label: 'Normal', tone: 'badge-teal' };
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  const toggleTimeSensitive = () => {
    setFilters(prev => ({ ...prev, timeSensitiveOnly: !prev.timeSensitiveOnly }));
  };

  const togglePerishableOnly = () => {
    setFilters(prev => ({ ...prev, perishableOnly: !prev.perishableOnly }));
  };

  const handleBundleChange = (e) => {
    setFilters(prev => ({ ...prev, bundle: e.target.value }));
  };

  const bundleOptions = [
    { value: 'all', label: 'All bundles' },
    { value: 'basic_food', label: 'Basic Food Box' },
    { value: 'hygiene_kit', label: 'Hygiene Kit' },
    { value: 'winter_clothing', label: 'Winter Clothing' },
    { value: 'cleaning_supplies', label: 'Cleaning Supplies' },
    { value: 'beautification', label: 'Beautification Projects' }
  ];

  // Show error state (only on critical errors)
  if (error && needs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={fetchManagerNeeds}
            className="btn-green-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-16 animate-slideInRight">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header - Apple Style */}
        <div className="hero-section mb-16 animate-slideInUp text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-semibold text-gray-900 mb-6 leading-tight tracking-tight">
              Manager <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed font-normal">
              Manage and monitor community needs with precision and care.
            </p>
            <button 
              onClick={() => window.location.href = '/manager/add-need'} 
              className="btn-green-primary text-lg px-8 py-4"
            >
              Add New Need
            </button>
          </div>
        </div>

        {/* Stats Cards - Apple Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="stat-card">
            <div className="text-3xl font-semibold text-gray-900 mb-1">{summary.urgent}</div>
            <div className="text-sm text-gray-600 font-medium">Urgent Needs</div>
            <div className="text-xs text-gray-500 mt-1">Critical priority items</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-semibold text-gray-900 mb-1">{summary.perishable}</div>
            <div className="text-sm text-gray-600 font-medium">Perishable Items</div>
            <div className="text-xs text-gray-500 mt-1">Quick turnaround required</div>
          </div>
          <div className="stat-card">
            <div className="text-3xl font-semibold text-gray-900 mb-1">{summary.service}</div>
            <div className="text-sm text-gray-600 font-medium">Service Tasks</div>
            <div className="text-xs text-gray-500 mt-1">Volunteer opportunities</div>
          </div>
        </div>

        {/* Filters - Apple Style */}
        <div className="mb-12">
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Bundle</label>
                <select value={filters.bundle} onChange={handleBundleChange} className="input-green text-sm">
                  {bundleOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-all w-full">
                  <input type="checkbox" id="timeSensitiveOnly" checked={filters.timeSensitiveOnly} onChange={toggleTimeSensitive} className="w-4 h-4 text-emerald-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Time-sensitive</span>
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-all w-full">
                  <input type="checkbox" id="perishableOnly" checked={filters.perishableOnly} onChange={togglePerishableOnly} className="w-4 h-4 text-emerald-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Perishables</span>
                </label>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={() => window.location.href = '/manager/events'} 
                  className="btn-green-secondary w-full text-sm py-2.5"
                >
                  Manage Events
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Needs Display */}
        {needs.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No needs found</h3>
            <p className="text-gray-600 mb-6">Create your first need to get started</p>
            <button
              onClick={() => window.location.href = '/manager/add-need'}
              className="btn-green-primary"
            >
              Add New Need
            </button>
          </div>
        ) : (
          <div className="premium-card-grid">
            {needs.map((need) => {
              const remaining = Math.max(0, (need.quantity || 0) - (need.quantity_fulfilled || 0));
              const indicator = getUrgencyIndicator(need);
              const deleteMsg = deleteMessages[need.id];

              return (
                <div key={need.id} className="card-green p-6 relative">
                  {/* Urgency Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`${indicator.tone} text-xs px-2.5 py-1`}>
                      {indicator.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mb-4 pr-24">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{need.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{need.description}</p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Needed By</div>
                      <div className="font-medium text-gray-900">{formatDate(need.needed_by)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Bundle</div>
                      <div className="font-medium text-gray-900">{(need.bundle_tag || 'other').replace('_', ' ')}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Remaining</div>
                      <div className="font-medium text-gray-900">{remaining} / {need.quantity}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Unit Cost</div>
                      <div className="font-medium text-gray-900">${Number(need.cost || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {need.is_perishable === 1 && (
                      <span className="badge-warning text-xs">Perishable</span>
                    )}
                    {need.service_required === 1 && (
                      <span className="badge-teal text-xs">Service Required</span>
                    )}
                    {need.request_count > 0 && (
                      <span className="badge-green text-xs">{need.request_count} requests</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => window.location.href = `/manager/edit-need/${need.id}`}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium text-sm transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => window.location.href = `/manager/events?needId=${need.id}`}
                      className="flex-1 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-medium text-sm transition-all"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => handleDeleteNeed(need.id, need.title)}
                      disabled={deleteMsg?.type === 'loading'}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                    >
                      {deleteMsg?.type === 'loading' ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>

                  {/* Delete Message */}
                  {deleteMsg && deleteMsg.type !== 'loading' && (
                    <div className={`mt-3 text-xs font-medium text-center py-2 rounded-lg ${
                      deleteMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {deleteMsg.text}
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
}

export default ManagerDashboard;
