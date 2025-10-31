import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getNeedById, updateNeed } from '../services/api';

/**
 * Edit Need Page - Update existing needs
 * Managers use this form to edit needs in their cupboard
 */
function EditNeed() {
  const { needId } = useParams(); // Get need ID from URL

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost: '',
    quantity: '',
    priority: 'normal',
    category: '',
    org_type: 'other'
  });

  // Original data for comparison
  const [originalData, setOriginalData] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch the need to edit
  const fetchNeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getNeedById(needId);

      if (response.success) {
        const need = response.need;
        
        // Populate form with existing data
        const data = {
          title: need.title || '',
          description: need.description || '',
          cost: need.cost || '',
          quantity: need.quantity || '',
          priority: need.priority || 'normal',
          category: need.category || '',
          org_type: need.org_type || 'other'
        };

        setFormData(data);
        setOriginalData(data); // Save original for comparison

      } else {
        setError('Need not found');
      }

    } catch (err) {
      console.error('Error fetching need:', err);
      setError('Error loading need. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [needId]);

  // Fetch need data on component load
  useEffect(() => {
    fetchNeed();
  }, [fetchNeed]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    // Cost validation
    if (!formData.cost) {
      errors.cost = 'Cost is required';
    } else if (isNaN(formData.cost) || parseFloat(formData.cost) <= 0) {
      errors.cost = 'Cost must be a positive number';
    } else if (parseFloat(formData.cost) > 999999.99) {
      errors.cost = 'Cost is too high';
    }

    // Quantity validation
    if (!formData.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
      errors.quantity = 'Quantity must be a positive whole number';
    } else if (!Number.isInteger(parseFloat(formData.quantity))) {
      errors.quantity = 'Quantity must be a whole number';
    } else if (parseInt(formData.quantity) > 999999) {
      errors.quantity = 'Quantity is too high';
    }

    // Priority validation
    if (!['urgent', 'high', 'normal'].includes(formData.priority)) {
      errors.priority = 'Invalid priority level';
    }

    // Category validation
    if (!formData.category) {
      errors.category = 'Please select a category';
    } else if (!['food', 'clothing', 'shelter', 'education', 'healthcare', 'other'].includes(formData.category)) {
      errors.category = 'Invalid category selected';
    }

    return errors;
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalData) return false;
    
    return Object.keys(formData).some(key => {
      return formData[key] !== originalData[key];
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if there are changes
    if (!hasChanges()) {
      setError('No changes detected. Modify the form to update the need.');
      return;
    }

    // Clear previous errors
    setError(null);
    setValidationErrors({});

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Start submitting
    setSubmitting(true);

    try {
      // Prepare data for API (only send changed fields)
      const updateData = {};
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          if (key === 'cost') {
            updateData[key] = parseFloat(formData[key]);
          } else if (key === 'quantity') {
            updateData[key] = parseInt(formData[key]);
          } else if (key === 'description' || key === 'category') {
            updateData[key] = formData[key].trim() || null;
          } else {
            updateData[key] = formData[key].trim();
          }
        }
      });

      // Call API
      const response = await updateNeed(needId, updateData);

      if (response.success) {
        // SUCCESS! Show success state
        setSuccess(true);

        // Update original data
        setOriginalData({ ...formData });

        // Scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } else {
        // API returned error
        setError(response.message || 'Failed to update need');
      }

    } catch (err) {
      console.error('Error updating need:', err);
      setError('Error connecting to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges()) {
      if (window.confirm('Cancel editing? Any unsaved changes will be lost.')) {
        window.location.href = '/manager';
      }
    } else {
      window.location.href = '/manager';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Show error loading need
  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-sm">
          <div className="text-red-700 mb-2">{error}</div>
          <button onClick={() => window.location.href = '/manager'} className="px-3 py-2 border rounded">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 pt-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Edit Need (Test Mode)</h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="border rounded p-3 mb-4 text-sm">Saved. <button onClick={() => window.location.href = '/manager'} className="text-blue-700">Back to Manager</button></div>
        )}

        {/* Error Message */}
        {error && formData.title && (
          <div className="border rounded p-3 mb-4 text-sm text-red-700">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="border rounded p-4">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Rice - 50kg bags"
              className={`w-full px-3 py-2 border rounded ${validationErrors.title ? 'border-red-500' : ''}`}
            />
            {validationErrors.title && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of what you need and why..."
              rows="4"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Cost and Quantity Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Cost */}
            <div>
              <label className="block text-sm font-bold mb-1">
                Cost per Item ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded ${validationErrors.cost ? 'border-red-500' : ''}`}
              />
              {validationErrors.cost && (
                <p className="text-red-400 text-sm mt-2">{validationErrors.cost}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold mb-1">
                Quantity Needed <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded ${validationErrors.quantity ? 'border-red-500' : ''}`}
              />
              {validationErrors.quantity && (
                <p className="text-red-400 text-sm mt-2">{validationErrors.quantity}</p>
              )}
            </div>
          </div>

          {/* Priority and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-bold mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded ${validationErrors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Select a category...</option>
                <option value="food">Food</option>
                <option value="clothing">Clothing</option>
                <option value="shelter">Shelter</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="other">Other</option>
              </select>
              {validationErrors.category && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.category}</p>
              )}
            </div>
          </div>

          {/* Organization Type */}
          <div className="mb-6">
            <label className="block text-white text-sm font-bold mb-2">
              Organization Type <span className="text-red-500">*</span>
            </label>
            <select
              name="org_type"
              value={formData.org_type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="food_bank">🍽️ Food Bank - Food assistance programs</option>
              <option value="animal_shelter">🐾 Animal Shelter - Animal care and adoption</option>
              <option value="hospital">🏥 Hospital - Medical care and supplies</option>
              <option value="school">📚 School - Educational materials and support</option>
              <option value="homeless_shelter">🏠 Homeless Shelter - Housing and basic needs</option>
              <option value="disaster_relief">🌍 Disaster Relief - Emergency assistance</option>
              <option value="other">🔷 Other - General non-profit</option>
            </select>
            <p className="text-gray-400 text-sm mt-1">Select your organization type for customized features</p>
          </div>

          {/* Changes Indicator */}
          {hasChanges() && (
            <div className="border rounded p-3 mb-4 text-xs">Unsaved changes.</div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !hasChanges()}
              className="px-4 py-2 border rounded text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditNeed;

