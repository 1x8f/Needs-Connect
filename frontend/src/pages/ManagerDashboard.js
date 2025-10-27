import React, { useState, useEffect } from 'react';
import { getAllNeeds, deleteNeed } from '../services/api';

/**
 * Manager Dashboard (Cupboard) - Manage needs
 * Managers can view, add, edit, and delete their needs
 */
function ManagerDashboard() {
  // State management
  const [needs, setNeeds] = useState([]);
  const [error, setError] = useState(null);
  const [deleteMessages, setDeleteMessages] = useState({}); // Track delete messages per need

  // TODO: Replace with actual logged-in user from authentication
  // For now, hardcoded as user 1 (admin - manager)
  const currentUsername = 'admin';

  // Fetch manager's needs on component load
  useEffect(() => {
    fetchManagerNeeds();
  }, []);

  // Fetch needs belonging to this manager
  const fetchManagerNeeds = async () => {
    try {
      setError(null);
      
      // Get all needs
      const response = await getAllNeeds();
      
      if (response.success) {
        // Filter to show only THIS manager's needs
        const managerNeeds = response.needs.filter(
          need => need.manager_username === currentUsername
        );
        setNeeds(managerNeeds);
      } else {
        setError('Failed to load needs');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching needs:', err);
    }
  };

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
        
        // Show success message briefly
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

      } else {
        setDeleteMessages(prev => ({
          ...prev,
          [needId]: { type: 'error', text: response.message || 'Failed to delete' }
        }));
      }

    } catch (err) {
      console.error('Error deleting need:', err);
      setDeleteMessages(prev => ({
        ...prev,
        [needId]: { type: 'error', text: 'Error connecting to server' }
      }));
    }
  };

  // Get priority color
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

  // Show error state (only on critical errors)
  if (error && needs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">{error}</div>
          <button
            onClick={fetchManagerNeeds}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Your Cupboard</h1>
            <p className="text-gray-300">Manage your organization's needs</p>
            <p className="text-gray-400 text-sm mt-2">Total needs: {needs.length}</p>
          </div>
          
          {/* Add Need Button */}
          <button
            onClick={() => window.location.href = '/manager/add-need'} // We'll create this route
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-lg transition-colors"
          >
            + Add New Need
          </button>
        </div>
      </div>

      {/* Empty State */}
      {needs.length === 0 && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-white mb-2">Your cupboard is empty</h2>
            <p className="text-gray-400 mb-6">Start by adding your organization's first need</p>
            <button
              onClick={() => window.location.href = '/manager/add-need'}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
            >
              Add First Need
            </button>
          </div>
        </div>
      )}

      {/* Needs List */}
      {needs.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6">
            {needs.map((need) => {
              const availableQuantity = need.quantity - need.quantity_fulfilled;
              const percentFunded = Math.round((need.quantity_fulfilled / need.quantity) * 100);
              const isFullyFunded = availableQuantity === 0;

              return (
                <div
                  key={need.id}
                  className="bg-gray-800 rounded-lg p-6 shadow-lg"
                >
                  {/* Header with priority and status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`${getPriorityColor(need.priority)} text-white text-xs font-bold px-3 py-1 rounded-full uppercase`}
                      >
                        {need.priority}
                      </span>
                      <span className="text-gray-400 text-sm">{need.category || 'General'}</span>
                      {isFullyFunded && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          FULLY FUNDED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white mb-2">{need.title}</h2>
                  
                  {/* Description */}
                  {need.description && (
                    <p className="text-gray-300 mb-4">{need.description}</p>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Cost per item</p>
                      <p className="text-white font-bold text-lg">${need.cost}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total needed</p>
                      <p className="text-white font-bold text-lg">{need.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Funded</p>
                      <p className="text-white font-bold text-lg">{need.quantity_fulfilled}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Remaining</p>
                      <p className="text-white font-bold text-lg">{availableQuantity}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Funding Progress</span>
                      <span>{percentFunded}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`${isFullyFunded ? 'bg-green-500' : 'bg-blue-500'} h-3 rounded-full transition-all`}
                        style={{ width: `${percentFunded}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => window.location.href = `/manager/edit-need/${need.id}`}
                      className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNeed(need.id, need.title)}
                      disabled={deleteMessages[need.id]?.type === 'loading'}
                      className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                    >
                      {deleteMessages[need.id]?.type === 'loading' ? 'Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>

                  {/* Delete Message */}
                  {deleteMessages[need.id] && deleteMessages[need.id].type !== 'loading' && (
                    <div className={`mt-3 p-3 rounded-lg ${
                      deleteMessages[need.id].type === 'success'
                        ? 'bg-green-900 text-green-200'
                        : 'bg-red-900 text-red-200'
                    }`}>
                      {deleteMessages[need.id].text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;

