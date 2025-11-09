// API Service - All backend API calls in one place
// Base URL for the backend API (uses proxy in development)
const API_BASE_URL = '/api';

// ===== AUTH APIs =====

/**
 * Login user (trust-based)
 * @param username - Username to login with
 * @returns User object with id, username, and role
 */
export const login = async (username: string) => {
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
 * @param filters - Optional filters (priority, category, search)
 * @returns Array of needs
 */
export const getAllNeeds = async (filters: Record<string, any> = {}) => {
  const queryParams = new URLSearchParams();

  const simpleFilters = ['priority', 'category', 'search', 'bundle', 'sort', 'dueWithin', 'managerId', 'limit'];
  simpleFilters.forEach((key) => {
    if (filters[key]) {
      queryParams.append(key, filters[key]);
    }
  });

  if (filters.perishable !== undefined) {
    queryParams.append('perishable', String(filters.perishable));
  }
  if (filters.service !== undefined) {
    queryParams.append('service', String(filters.service));
  }
  if (filters.timeSensitiveOnly !== undefined) {
    queryParams.append('timeSensitiveOnly', String(filters.timeSensitiveOnly));
  }
  if (filters.beautificationOnly !== undefined) {
    queryParams.append('beautificationOnly', String(filters.beautificationOnly));
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `${API_BASE_URL}/needs?${queryString}`
    : `${API_BASE_URL}/needs`;

  const response = await fetch(url);
  return response.json();
};

/**
 * Get single need by ID
 * @param needId - Need ID
 * @returns Need object
 */
export const getNeedById = async (needId: number) => {
  const response = await fetch(`${API_BASE_URL}/needs/${needId}`);
  return response.json();
};

/**
 * Create new need (managers only)
 * @param needData - Need data (title, description, cost, etc.)
 * @returns Created need object
 */
export const createNeed = async (needData: any) => {
  const response = await fetch(`${API_BASE_URL}/needs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(needData)
  });
  return response.json();
};

/**
 * Update existing need
 * @param needId - Need ID
 * @param updateData - Fields to update
 * @returns Updated need object
 */
export const updateNeed = async (needId: number, updateData: any) => {
  const response = await fetch(`${API_BASE_URL}/needs/${needId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return response.json();
};

/**
 * Delete need
 * @param needId - Need ID
 * @returns Success message
 */
export const deleteNeed = async (needId: number) => {
  const response = await fetch(`${API_BASE_URL}/needs/${needId}`, {
    method: 'DELETE'
  });
  return response.json();
};

// ===== BASKET APIs =====

/**
 * Get user's basket
 * @param userId - User ID
 * @returns Basket items and total cost
 */
export const getBasket = async (userId: number) => {
  const response = await fetch(`${API_BASE_URL}/basket/${userId}`);
  return response.json();
};

/**
 * Add item to basket
 * @param data - { user_id, need_id, quantity }
 * @returns Basket item with need details
 */
export const addToBasket = async (data: { user_id: number; need_id: number; quantity: number }) => {
  const response = await fetch(`${API_BASE_URL}/basket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

/**
 * Update basket item quantity
 * @param basketItemId - Basket item ID
 * @param quantity - New quantity
 * @returns Updated basket item
 */
export const updateBasketItem = async (basketItemId: number, quantity: number) => {
  const response = await fetch(`${API_BASE_URL}/basket/${basketItemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  return response.json();
};

/**
 * Remove item from basket
 * @param basketItemId - Basket item ID
 * @returns Success message
 */
export const removeFromBasket = async (basketItemId: number) => {
  const response = await fetch(`${API_BASE_URL}/basket/${basketItemId}`, {
    method: 'DELETE'
  });
  return response.json();
};

/**
 * Clear entire basket
 * @param userId - User ID
 * @returns Success message
 */
export const clearBasket = async (userId: number) => {
  const response = await fetch(`${API_BASE_URL}/basket/clear/${userId}`, {
    method: 'DELETE'
  });
  return response.json();
};

// ===== FUNDING APIs =====

/**
 * Checkout - fund all items in basket
 * @param userId - User ID
 * @returns Funding records and total amount
 */
export const checkout = async (userId: number) => {
  const response = await fetch(`${API_BASE_URL}/funding/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};

/**
 * Get user's funding history
 * @param userId - User ID
 * @returns Funding history and total funded
 */
export const getUserFunding = async (userId: number) => {
  const response = await fetch(`${API_BASE_URL}/funding/user/${userId}`);
  return response.json();
};

/**
 * Get all funding records (for managers to see helper activity)
 * @returns All funding records with helper details
 */
export const getAllFunding = async () => {
  const response = await fetch(`${API_BASE_URL}/funding/all`);
  return response.json();
};

/**
 * Get funding records for a specific need
 * @param needId - Need ID
 * @returns Funding records for the need
 */
export const getNeedFunding = async (needId: number) => {
  const response = await fetch(`${API_BASE_URL}/funding/need/${needId}`);
  return response.json();
};

// ===== EVENTS APIs =====

/**
 * Get upcoming events
 * @param filters - Optional filters
 * @returns Events array
 */
export const getUpcomingEvents = async (filters: Record<string, any> = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const url = params.toString()
    ? `${API_BASE_URL}/events/upcoming?${params.toString()}`
    : `${API_BASE_URL}/events/upcoming`;
  const response = await fetch(url);
  return response.json();
};

/**
 * Create event
 * @param eventData - Event data
 * @returns Created event
 */
export const createEvent = async (eventData: any) => {
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });
  return response.json();
};

/**
 * Update existing event
 * @param eventId - Event ID
 * @param updateData - Fields to update
 * @returns Updated event object
 */
export const updateEvent = async (eventId: number, updateData: any) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return response.json();
};

/**
 * Delete event
 * @param eventId - Event ID
 * @returns Success message
 */
export const deleteEvent = async (eventId: number) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete event' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Sign up for event
 * @param eventId - Event ID
 * @param userId - User ID
 * @returns Success message
 */
export const signupForEvent = async (eventId: number, userId: number) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};

