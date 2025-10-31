import React, { useState, useEffect } from 'react';
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
          need => need.manager_username === user.username
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
    <div className="min-h-screen bg-white p-6 pt-16">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manager (Test Mode)</h1>
        <button onClick={() => window.location.href = '/manager/add-need'} className="px-3 py-2 border rounded text-sm">+ Add Need</button>
      </div>

      {/* Empty State */}
      {needs.length === 0 && (
        <div className="max-w-4xl mx-auto border border-dashed rounded p-8 text-center">No needs yet.</div>
      )}

      {/* Needs List */}
      {needs.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Cost</th>
                <th className="p-2 text-left">Qty</th>
                <th className="p-2 text-left">Funded</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {needs.map((need) => (
                <tr key={need.id} className="border-t">
                  <td className="p-2">{need.title}</td>
                  <td className="p-2">${need.cost}</td>
                  <td className="p-2">{need.quantity}</td>
                  <td className="p-2">{need.quantity_fulfilled}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => window.location.href = `/manager/edit-need/${need.id}`} className="px-2 py-1 border rounded">Edit</button>
                    <button onClick={() => handleDeleteNeed(need.id, need.title)} className="px-2 py-1 border rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;

