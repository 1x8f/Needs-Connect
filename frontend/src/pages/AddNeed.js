import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createNeed } from '../services/api';

/**
 * Add Need Page - Create new needs
 * Managers use this form to add new needs to their cupboard
 */
function AddNeed() {
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cost: '',
    quantity: '',
    priority: 'normal',
    category: '',
    org_type: 'other',
    needed_by: '',
    is_perishable: false,
    bundle_tag: 'other',
    service_required: false,
    request_count: '0'
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));

    // Clear validation error for this field when user types
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

    if (formData.needed_by) {
      const selectedDate = new Date(formData.needed_by);
      if (Number.isNaN(selectedDate.getTime())) {
        errors.needed_by = 'Please provide a valid needed by date';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          errors.needed_by = 'Needed by date cannot be in the past';
        }
      }
    }

    if (formData.bundle_tag && !['basic_food', 'winter_clothing', 'hygiene_kit', 'cleaning_supplies', 'beautification', 'other'].includes(formData.bundle_tag)) {
      errors.bundle_tag = 'Invalid bundle selection';
    }

    if (formData.request_count !== undefined && formData.request_count !== '') {
      const requestCountNumber = parseInt(formData.request_count, 10);
      if (Number.isNaN(requestCountNumber) || requestCountNumber < 0) {
        errors.request_count = 'Request count must be zero or greater';
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      // Prepare data for API
      const needData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        cost: parseFloat(formData.cost),
        quantity: parseInt(formData.quantity),
        priority: formData.priority,
        category: formData.category.trim() || null,
        org_type: formData.org_type,
        needed_by: formData.needed_by || null,
        is_perishable: Boolean(formData.is_perishable),
        bundle_tag: formData.bundle_tag,
        service_required: Boolean(formData.service_required),
        request_count: formData.request_count === '' ? 0 : parseInt(formData.request_count, 10) || 0,
        manager_id: user.id
      };

      // Call API
      const response = await createNeed(needData);

      if (response.success) {
        // SUCCESS! Show success state
        setSuccess(true);

        // Reset form
        setFormData({
          title: '',
          description: '',
          cost: '',
          quantity: '',
          priority: 'normal',
          category: '',
          org_type: 'other',
          needed_by: '',
          is_perishable: false,
          bundle_tag: 'other',
          service_required: false,
          request_count: '0'
        });

        // Scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } else {
        // API returned error
        setError(response.message || 'Failed to create need');
      }

    } catch (err) {
      console.error('Error creating need:', err);
      setError('Error connecting to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Cancel creating this need? Any unsaved changes will be lost.')) {
      window.location.href = '/manager';
    }
  };

  return (
    <div className="min-h-screen p-6 pt-4 pb-12 animate-slideInRight">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Add Need</h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="border rounded p-4 mb-4 text-sm">Created. <button onClick={() => window.location.href = '/manager'} className="text-blue-700">Back to Manager</button></div>
        )}

        {/* Error Message */}
        {error && (
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
            <p className="text-slate-600 text-xs mt-1">Optional.</p>
          </div>

          {/* Cost and Quantity Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                placeholder="25.00"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded ${validationErrors.cost ? 'border-red-500' : ''}`}
              />
              {validationErrors.cost && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.cost}</p>
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
                placeholder="50"
                min="1"
                className={`w-full px-3 py-2 border rounded ${validationErrors.quantity ? 'border-red-500' : ''}`}
              />
              {validationErrors.quantity && (
                <p className="text-red-600 text-xs mt-1">{validationErrors.quantity}</p>
              )}
            </div>
          </div>

          {/* Priority and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              <p className="text-slate-600 text-xs mt-1">Used to sort.</p>
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

        {/* Time Sensitivity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold mb-1">
              Needed By
            </label>
            <input
              type="date"
              name="needed_by"
              value={formData.needed_by}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded ${validationErrors.needed_by ? 'border-red-500' : ''}`}
            />
            <p className="text-slate-600 text-xs mt-1">Helps prioritize items with upcoming deadlines.</p>
            {validationErrors.needed_by && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.needed_by}</p>
            )}
          </div>

          <div className="flex items-center gap-3 border rounded px-3 py-2">
            <input
              type="checkbox"
              id="is_perishable"
              name="is_perishable"
              checked={formData.is_perishable}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <div>
              <label htmlFor="is_perishable" className="text-sm font-bold block">
                Mark as Perishable
              </label>
              <p className="text-xs text-slate-600">Urgent after creation and boosts priority scoring.</p>
            </div>
          </div>
        </div>

        {/* Bundles and Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold mb-1">
              Bundle Tag
            </label>
            <select
              name="bundle_tag"
              value={formData.bundle_tag}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded ${validationErrors.bundle_tag ? 'border-red-500' : ''}`}
            >
              <option value="other">No bundle</option>
              <option value="basic_food">Basic Food Box</option>
              <option value="hygiene_kit">Hygiene Kit</option>
              <option value="winter_clothing">Winter Clothing Drive</option>
              <option value="cleaning_supplies">Cleaning Supplies</option>
              <option value="beautification">Neighborhood Beautification</option>
            </select>
            <p className="text-slate-600 text-xs mt-1">Group similar items for quick helper browsing.</p>
            {validationErrors.bundle_tag && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.bundle_tag}</p>
            )}
          </div>

          <div className="flex items-center gap-3 border rounded px-3 py-2">
            <input
              type="checkbox"
              id="service_required"
              name="service_required"
              checked={formData.service_required}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <div>
              <label htmlFor="service_required" className="text-sm font-bold block">
                Service / Volunteer Task
              </label>
              <p className="text-xs text-slate-600">Flag cleanups or distribution activities.</p>
            </div>
          </div>
        </div>

        {/* Request frequency */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-1">
            Repeated Requests (how often this returns?)
          </label>
          <input
            type="number"
            name="request_count"
            min="0"
            value={formData.request_count}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded ${validationErrors.request_count ? 'border-red-500' : ''}`}
          />
          <p className="text-slate-600 text-xs mt-1">Use this to highlight frequently recurring needs.</p>
          {validationErrors.request_count && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.request_count}</p>
          )}
        </div>

          {/* Organization Type */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-1">
              Organization Type <span className="text-red-500">*</span>
            </label>
            <select
              name="org_type"
              value={formData.org_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="food_bank">Food Bank</option>
              <option value="animal_shelter">Animal Shelter</option>
              <option value="hospital">Hospital</option>
              <option value="school">School</option>
              <option value="homeless_shelter">Homeless Shelter</option>
              <option value="disaster_relief">Disaster Relief</option>
              <option value="other">Other</option>
            </select>
            <p className="text-slate-600 text-xs mt-1">Used for display only.</p>
          </div>

          {/* Total Cost Preview */}
          {formData.cost && formData.quantity && !isNaN(formData.cost) && !isNaN(formData.quantity) && (
            <div className="border rounded p-3 mb-4 text-sm">Total if fully funded: ${(parseFloat(formData.cost) * parseInt(formData.quantity)).toFixed(2)}</div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 border rounded text-sm"
            >
              {submitting ? 'Creating Need...' : 'Create Need'}
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

export default AddNeed;

