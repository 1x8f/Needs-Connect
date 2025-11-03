// Needs Controller
// Handles all business logic for managing needs (CRUD operations)

const pool = require('../database/db');

const PRIORITY_WEIGHTS = {
  urgent: 60,
  high: 40,
  normal: 20
};

const PRIORITY_ORDER = {
  urgent: 1,
  high: 2,
  normal: 3
};

const BUNDLE_TAGS = new Set(['basic_food', 'winter_clothing', 'hygiene_kit', 'cleaning_supplies', 'beautification', 'other']);

const VALID_ORG_TYPES = ['food_bank', 'animal_shelter', 'hospital', 'school', 'homeless_shelter', 'disaster_relief', 'other'];

const calculateUrgencyScore = (need) => {
  const today = new Date();
  const basePriority = PRIORITY_WEIGHTS[need.priority] || 10;

  let deadlineScore = 0;
  if (need.needed_by) {
    const dueDate = new Date(need.needed_by);
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    if (!Number.isNaN(diffDays)) {
      if (diffDays <= 0) {
        deadlineScore = 35; // overdue
      } else if (diffDays <= 3) {
        deadlineScore = 30;
      } else if (diffDays <= 7) {
        deadlineScore = 20;
      } else if (diffDays <= 14) {
        deadlineScore = 10;
      }
    }
  }

  const remaining = Math.max(0, (need.quantity || 0) - (need.quantity_fulfilled || 0));
  const lowInventoryScore = remaining === 0 ? 0 : remaining <= Math.ceil((need.quantity || 1) * 0.25) ? 10 : 0;

  const perishableScore = need.is_perishable ? 15 : 0;
  const requestScore = Math.min((need.request_count || 0) * 5, 25);
  const serviceBoost = need.service_required ? 10 : 0;

  return basePriority + deadlineScore + lowInventoryScore + perishableScore + requestScore + serviceBoost;
};

const sortNeeds = (needs, sortParam = 'urgency') => {
  if (sortParam === 'needed_by') {
    return [...needs].sort((a, b) => {
      const aTime = a.needed_by ? new Date(a.needed_by).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.needed_by ? new Date(b.needed_by).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
  }

  if (sortParam === 'frequency') {
    return [...needs].sort((a, b) => (b.request_count || 0) - (a.request_count || 0));
  }

  if (sortParam === 'priority') {
    return [...needs].sort((a, b) => (PRIORITY_ORDER[a.priority] || 4) - (PRIORITY_ORDER[b.priority] || 4));
  }

  return [...needs].sort((a, b) => {
    if (b.urgency_score !== a.urgency_score) {
      return (b.urgency_score || 0) - (a.urgency_score || 0);
    }
    const aTime = a.needed_by ? new Date(a.needed_by).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.needed_by ? new Date(b.needed_by).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
};

/**
 * Get all needs with optional filtering
 * 
 * Query parameters:
 * - priority: Filter by priority level (urgent, high, normal)
 * - category: Filter by category (partial match)
 * - search: Search in title and description
 * 
 * @route GET /api/needs
 * @access Public
 */
const getAllNeeds = async (req, res) => {
  try {
    const {
      priority,
      category,
      search,
      bundle,
      sort = 'urgency',
      perishable,
      service,
      dueWithin,
      timeSensitiveOnly,
      beautificationOnly,
      managerId,
      limit
    } = req.query;

    let query = `
      SELECT 
        needs.*,
        users.username as manager_username
      FROM needs
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (priority) {
      query += ' AND needs.priority = ?';
      queryParams.push(priority);
    }

    if (category) {
      query += ' AND needs.category LIKE ?';
      queryParams.push(`%${category}%`);
    }

    if (bundle && BUNDLE_TAGS.has(bundle)) {
      query += ' AND needs.bundle_tag = ?';
      queryParams.push(bundle);
    }

    if (perishable === 'true') {
      query += ' AND needs.is_perishable = 1';
    } else if (perishable === 'false') {
      query += ' AND needs.is_perishable = 0';
    }

    if (service === 'true') {
      query += ' AND needs.service_required = 1';
    } else if (service === 'false') {
      query += ' AND needs.service_required = 0';
    }

    if (beautificationOnly === 'true') {
      query += " AND (needs.bundle_tag = 'beautification' OR needs.service_required = 1)";
    }

    if (managerId) {
      query += ' AND needs.manager_id = ?';
      queryParams.push(managerId);
    }

    if (dueWithin) {
      const windowDays = parseInt(dueWithin, 10);
      if (!Number.isNaN(windowDays) && windowDays > 0) {
        query += ' AND needs.needed_by IS NOT NULL AND needs.needed_by <= DATE_ADD(CURDATE(), INTERVAL ? DAY)';
        queryParams.push(windowDays);
      }
    }

    if (search) {
      query += ' AND (needs.title LIKE ? OR needs.description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY needs.created_at DESC';

    const [needs] = await pool.query(query, queryParams);

    const today = new Date();
    let enrichedNeeds = needs.map((need) => {
      const remaining_quantity = Math.max(0, (Number(need.quantity) || 0) - (Number(need.quantity_fulfilled) || 0));
      const neededByDate = need.needed_by ? new Date(need.needed_by) : null;
      const due_in_days = neededByDate ? Math.ceil((neededByDate - today) / (1000 * 60 * 60 * 24)) : null;
      const urgency_score = calculateUrgencyScore({
        ...need,
        quantity: Number(need.quantity) || 0,
        quantity_fulfilled: Number(need.quantity_fulfilled) || 0,
        request_count: Number(need.request_count) || 0,
        is_perishable: need.is_perishable === 1 || need.is_perishable === true || need.is_perishable === '1',
        service_required: need.service_required === 1 || need.service_required === true || need.service_required === '1'
      });

      return {
        ...need,
        quantity: Number(need.quantity) || 0,
        quantity_fulfilled: Number(need.quantity_fulfilled) || 0,
        request_count: Number(need.request_count) || 0,
        is_perishable: need.is_perishable === 1 || need.is_perishable === true || need.is_perishable === '1',
        service_required: need.service_required === 1 || need.service_required === true || need.service_required === '1',
        remaining_quantity,
        urgency_score,
        due_in_days
      };
    });

    if (timeSensitiveOnly === 'true') {
      enrichedNeeds = enrichedNeeds.filter((need) => {
        if (need.urgency_score >= 70) return true;
        if (need.due_in_days !== null && need.due_in_days <= 7) return true;
        if (need.is_perishable && (need.due_in_days === null || need.due_in_days <= 10)) return true;
        return false;
      });
    }

    const sortedNeeds = sortNeeds(enrichedNeeds, sort);
    const limitedNeeds = limit ? sortedNeeds.slice(0, parseInt(limit, 10)) : sortedNeeds;

    return res.status(200).json({
      success: true,
      count: limitedNeeds.length,
      needs: limitedNeeds
    });

  } catch (error) {
    console.error('Error in getAllNeeds:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve needs',
      error: error.message
    });
  }
};

/**
 * Get a single need by ID
 * 
 * @route GET /api/needs/:id
 * @access Public
 */
const getNeedById = async (req, res) => {
  try {
    // Extract and validate ID from params
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid need ID - must be a number'
      });
    }

    // Query need with manager information
    const query = `
      SELECT 
        needs.*,
        users.username as manager_username,
        users.role as manager_role
      FROM needs
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE needs.id = ?
    `;

    const [needs] = await pool.query(query, [id]);

    // Check if need exists
    if (needs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Need not found'
      });
    }

    const needRecord = needs[0];
    const normalizedNeed = {
      ...needRecord,
      quantity: Number(needRecord.quantity) || 0,
      quantity_fulfilled: Number(needRecord.quantity_fulfilled) || 0,
      request_count: Number(needRecord.request_count) || 0,
      is_perishable: needRecord.is_perishable === 1 || needRecord.is_perishable === true || needRecord.is_perishable === '1',
      service_required: needRecord.service_required === 1 || needRecord.service_required === true || needRecord.service_required === '1'
    };
    normalizedNeed.urgency_score = calculateUrgencyScore(normalizedNeed);
    normalizedNeed.remaining_quantity = Math.max(0, normalizedNeed.quantity - normalizedNeed.quantity_fulfilled);

    return res.status(200).json({
      success: true,
      need: normalizedNeed
    });

  } catch (error) {
    console.error('Error in getNeedById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve need',
      error: error.message
    });
  }
};

/**
 * Create a new need
 * 
 * Required fields: title, cost, quantity, manager_id
 * Optional fields: description, priority, category
 * 
 * @route POST /api/needs
 * @access Manager only (should be protected with middleware)
 */
const createNeed = async (req, res) => {
  try {
    // Extract fields from request body
    const {
      title,
      description,
      cost,
      quantity,
      priority,
      category,
      org_type,
      needed_by,
      is_perishable,
      bundle_tag,
      service_required,
      request_count,
      manager_id
    } = req.body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!cost && cost !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost is required'
      });
    }

    if (!quantity && quantity !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    if (!manager_id) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required'
      });
    }

    // Validate cost is a positive number
    if (isNaN(cost) || parseFloat(cost) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost must be a positive number'
      });
    }

    // Validate quantity is a positive integer
    if (isNaN(quantity) || parseInt(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer (at least 1)'
      });
    }

    // Validate priority if provided
    const validPriorities = ['urgent', 'high', 'normal'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be one of: urgent, high, normal'
      });
    }

    // Validate org_type if provided
    if (org_type && !VALID_ORG_TYPES.includes(org_type)) {
      return res.status(400).json({
        success: false,
        message: 'Organization type must be one of: food_bank, animal_shelter, hospital, school, homeless_shelter, disaster_relief, other'
      });
    }

    // Validate bundle tag
    const resolvedBundleTag = bundle_tag && BUNDLE_TAGS.has(bundle_tag) ? bundle_tag : 'other';

    // Validate needed_by date
    let normalizedNeededBy = null;
    if (needed_by) {
      const parsedDate = new Date(needed_by);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'needed_by must be a valid date'
        });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedDate < today) {
        return res.status(400).json({
          success: false,
          message: 'needed_by cannot be in the past'
        });
      }
      normalizedNeededBy = parsedDate.toISOString().slice(0, 10);
    }

    const normalizedPerishable = Boolean(is_perishable);
    const normalizedService = Boolean(service_required);
    const normalizedRequestCount = Number.isInteger(request_count) && request_count >= 0
      ? request_count
      : normalizedPerishable || resolvedBundleTag !== 'other'
        ? 1
        : 0;

    // Verify manager exists and has manager role
    const [managers] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [manager_id]
    );

    if (managers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Manager not found'
      });
    }

    if (managers[0].role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'User must have manager role to create needs'
      });
    }

    // Insert new need into database
    const insertQuery = `
      INSERT INTO needs 
      (title, description, cost, quantity, priority, category, org_type, needed_by, is_perishable, bundle_tag, service_required, request_count, manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      title.trim(),
      description || null,
      parseFloat(cost),
      parseInt(quantity),
      priority || 'normal',
      category || null,
      org_type || 'other',
      normalizedNeededBy,
      normalizedPerishable ? 1 : 0,
      resolvedBundleTag,
      normalizedService ? 1 : 0,
      normalizedRequestCount,
      manager_id
    ]);

    // Get the newly created need ID
    const needId = result.insertId;

    // Retrieve the complete need with manager info
    const [newNeed] = await pool.query(
      `
      SELECT 
        needs.*,
        users.username as manager_username
      FROM needs
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE needs.id = ?
      `,
      [needId]
    );

    // Return success response with created need
    return res.status(201).json({
      success: true,
      message: 'Need created successfully',
      need: newNeed[0]
    });

  } catch (error) {
    console.error('Error in createNeed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create need',
      error: error.message
    });
  }
};

/**
 * Update an existing need
 * 
 * Updates only the fields provided in request body
 * 
 * @route PUT /api/needs/:id
 * @access Manager only (should be protected with middleware)
 */
const updateNeed = async (req, res) => {
  try {
    // Extract need ID from params
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid need ID - must be a number'
      });
    }

    // Check if need exists
    const [existingNeeds] = await pool.query(
      'SELECT * FROM needs WHERE id = ?',
      [id]
    );

    if (existingNeeds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Need not found'
      });
    }

    // Extract fields from request body
    const {
      title,
      description,
      cost,
      quantity,
      quantity_fulfilled,
      priority,
      category,
      org_type,
      needed_by,
      is_perishable,
      bundle_tag,
      service_required,
      request_count
    } = req.body;

    // Validate cost if provided
    if (cost !== undefined && (isNaN(cost) || parseFloat(cost) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cost must be a positive number'
      });
    }

    // Validate quantity if provided
    if (quantity !== undefined && (isNaN(quantity) || parseInt(quantity) < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer (at least 1)'
      });
    }

    // Validate quantity_fulfilled if provided
    if (quantity_fulfilled !== undefined) {
      if (isNaN(quantity_fulfilled) || parseInt(quantity_fulfilled) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity fulfilled must be a non-negative integer'
        });
      }
      
      // Check if quantity_fulfilled doesn't exceed quantity
      const finalQuantity = quantity !== undefined ? parseInt(quantity) : existingNeeds[0].quantity;
      if (parseInt(quantity_fulfilled) > finalQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Quantity fulfilled cannot exceed total quantity'
        });
      }
    }

    // Validate priority if provided
    const validPriorities = ['urgent', 'high', 'normal'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be one of: urgent, high, normal'
      });
    }

    // Validate org_type if provided
    if (org_type && !VALID_ORG_TYPES.includes(org_type)) {
      return res.status(400).json({
        success: false,
        message: 'Organization type must be one of: food_bank, animal_shelter, hospital, school, homeless_shelter, disaster_relief, other'
      });
    }

    if (bundle_tag && !BUNDLE_TAGS.has(bundle_tag)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bundle tag provided'
      });
    }

    if (request_count !== undefined) {
      const parsedRequestCount = parseInt(request_count, 10);
      if (Number.isNaN(parsedRequestCount) || parsedRequestCount < 0) {
        return res.status(400).json({
          success: false,
          message: 'request_count must be a non-negative integer'
        });
      }
    }

    let normalizedNeededBy = undefined;
    if (needed_by !== undefined) {
      if (needed_by === null || needed_by === '') {
        normalizedNeededBy = null;
      } else {
        const parsedDate = new Date(needed_by);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'needed_by must be a valid date'
          });
        }
        normalizedNeededBy = parsedDate.toISOString().slice(0, 10);
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (cost !== undefined) {
      updates.push('cost = ?');
      values.push(parseFloat(cost));
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(parseInt(quantity));
    }
    if (quantity_fulfilled !== undefined) {
      updates.push('quantity_fulfilled = ?');
      values.push(parseInt(quantity_fulfilled));
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (org_type !== undefined) {
      updates.push('org_type = ?');
      values.push(org_type);
    }
    if (normalizedNeededBy !== undefined) {
      updates.push('needed_by = ?');
      values.push(normalizedNeededBy);
    }
    if (is_perishable !== undefined) {
      updates.push('is_perishable = ?');
      values.push(is_perishable ? 1 : 0);
    }
    if (bundle_tag !== undefined) {
      updates.push('bundle_tag = ?');
      values.push(bundle_tag);
    }
    if (service_required !== undefined) {
      updates.push('service_required = ?');
      values.push(service_required ? 1 : 0);
    }
    if (request_count !== undefined) {
      updates.push('request_count = ?');
      values.push(parseInt(request_count, 10));
    }

    // Check if there are any fields to update
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update'
      });
    }

    // Add ID to values array for WHERE clause
    values.push(id);

    // Execute update query
    const updateQuery = `UPDATE needs SET ${updates.join(', ')} WHERE id = ?`;
    await pool.query(updateQuery, values);

    // Retrieve updated need with manager info
    const [updatedNeed] = await pool.query(
      `
      SELECT 
        needs.*,
        users.username as manager_username
      FROM needs
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE needs.id = ?
      `,
      [id]
    );

    // Return success response with updated need
    return res.status(200).json({
      success: true,
      message: 'Need updated successfully',
      need: updatedNeed[0]
    });

  } catch (error) {
    console.error('Error in updateNeed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update need',
      error: error.message
    });
  }
};

/**
 * Delete a need
 * 
 * @route DELETE /api/needs/:id
 * @access Manager only (should be protected with middleware)
 */
const deleteNeed = async (req, res) => {
  try {
    // Extract need ID from params
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid need ID - must be a number'
      });
    }

    // Check if need exists
    const [existingNeeds] = await pool.query(
      'SELECT id FROM needs WHERE id = ?',
      [id]
    );

    if (existingNeeds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Need not found'
      });
    }

    // Delete the need
    // Note: This will CASCADE delete related baskets and funding records
    await pool.query('DELETE FROM needs WHERE id = ?', [id]);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Need deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteNeed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete need',
      error: error.message
    });
  }
};

const getUrgentNeeds = async (req, res) => {
  const limit = req.query.limit || '10';
  return getAllNeeds(
    {
      query: {
        ...req.query,
        limit,
        sort: 'urgency',
        timeSensitiveOnly: req.query.timeSensitiveOnly ?? 'true'
      }
    },
    res
  );
};

const getBundleNeeds = async (req, res) => {
  const { bundleTag } = req.params;
  if (!BUNDLE_TAGS.has(bundleTag)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid bundle requested'
    });
  }

  return getAllNeeds(
    {
      query: {
        ...req.query,
        bundle: bundleTag,
        sort: req.query.sort || 'urgency'
      }
    },
    res
  );
};

const getBeautificationNeeds = async (req, res) => {
  return getAllNeeds(
    {
      query: {
        ...req.query,
        beautificationOnly: 'true',
        sort: req.query.sort || 'urgency'
      }
    },
    res
  );
};

// Export all controller functions
module.exports = {
  getAllNeeds,
  getNeedById,
  createNeed,
  updateNeed,
  deleteNeed,
  getUrgentNeeds,
  getBundleNeeds,
  getBeautificationNeeds
};
