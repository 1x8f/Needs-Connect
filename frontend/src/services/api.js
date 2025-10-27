// API Service - All backend API calls in one place
// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5000/api';

// ===== AUTH APIs =====

/**
 * Login user (trust-based)
 * @param {string} username - Username to login with
 * @returns {Promise} User object with id, username, and role
 */
export const login = async (username) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  return response.json();
};

// ===== NEEDS APIs =====

/**
 * Get all needs with optional filters
 * @param {Object} filters - Optional filters (priority, category, search)
 * @returns {Promise} Array of needs
 */
export const getAllNeeds = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.priority) queryParams.append('priority', filters.priority);
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.search) queryParams.append('search', filters.search);
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${API_BASE_URL}/needs?${queryString}` 
    : `${API_BASE_URL}/needs`;
  
  const response = await fetch(url);
  return response.json();
};

/**
 * Get single need by ID
 * @param {number} needId - Need ID
 * @returns {Promise} Need object
 */
export const getNeedById = async (needId) => {
  const response = await fetch(`${API_BASE_URL}/needs/${needId}`);
  return response.json();
};

/**
 * Create new need (managers only)
 * @param {Object} needData - Need data (title, description, cost, etc.)
 * @returns {Promise} Created need object
 */
export const createNeed = async (needData) => {
  const response = await fetch(`${API_BASE_URL}/needs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(needData)
  });
  return response.json();
};

/**
 * Update existing need
 * @param {number} needId - Need ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise} Updated need object
 */
export const updateNeed = async (needId, updateData) => {
  const response = await fetch(`${API_BASE_URL}/needs/${needId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return response.json();
};

/**
 * Delete need
 * @param {number} needId - Need ID
 * @returns {Promise} Success message
 */
export const deleteNeed = async (needId) => {
  const response = await fetch(`${API_BASE_URL}/needs/${needId}`, {
    method: 'DELETE'
  });
  return response.json();
};

// ===== BASKET APIs =====

/**
 * Get user's basket
 * @param {number} userId - User ID
 * @returns {Promise} Basket items and total cost
 */
export const getBasket = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/basket/${userId}`);
  return response.json();
};

/**
 * Add item to basket
 * @param {Object} data - { user_id, need_id, quantity }
 * @returns {Promise} Basket item with need details
 */
export const addToBasket = async (data) => {
  const response = await fetch(`${API_BASE_URL}/basket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

/**
 * Update basket item quantity
 * @param {number} basketItemId - Basket item ID
 * @param {number} quantity - New quantity
 * @returns {Promise} Updated basket item
 */
export const updateBasketItem = async (basketItemId, quantity) => {
  const response = await fetch(`${API_BASE_URL}/basket/${basketItemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  return response.json();
};

/**
 * Remove item from basket
 * @param {number} basketItemId - Basket item ID
 * @returns {Promise} Success message
 */
export const removeFromBasket = async (basketItemId) => {
  const response = await fetch(`${API_BASE_URL}/basket/${basketItemId}`, {
    method: 'DELETE'
  });
  return response.json();
};

/**
 * Clear entire basket
 * @param {number} userId - User ID
 * @returns {Promise} Success message
 */
export const clearBasket = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/basket/clear/${userId}`, {
    method: 'DELETE'
  });
  return response.json();
};

// ===== FUNDING APIs =====

/**
 * Checkout - fund all items in basket
 * @param {number} userId - User ID
 * @returns {Promise} Funding records and total amount
 */
export const checkout = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/funding/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};

/**
 * Get user's funding history
 * @param {number} userId - User ID
 * @returns {Promise} Funding history and total funded
 */
export const getUserFunding = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/funding/user/${userId}`);
  return response.json();
};

/**
 * Get all funding records (admin view)
 * @returns {Promise} All funding records and grand total
 */
export const getAllFunding = async () => {
  const response = await fetch(`${API_BASE_URL}/funding/all`);
  return response.json();
};

/**
 * Get funding for specific need
 * @param {number} needId - Need ID
 * @returns {Promise} Funding records for that need
 */
export const getNeedFunding = async (needId) => {
  const response = await fetch(`${API_BASE_URL}/funding/need/${needId}`);
  return response.json();
};

