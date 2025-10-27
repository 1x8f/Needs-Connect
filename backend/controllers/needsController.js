// Needs Controller
// Handles all business logic for managing needs (CRUD operations)

const pool = require('../database/db');

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
    // Extract query parameters for filtering
    const { priority, category, search } = req.query;

    // Base query with LEFT JOIN to get manager information
    let query = `
      SELECT 
        needs.*,
        users.username as manager_username
      FROM needs
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE 1=1
    `;
    
    // Array to hold query parameters
    const queryParams = [];

    // Add priority filter if provided
    if (priority) {
      query += ' AND needs.priority = ?';
      queryParams.push(priority);
    }

    // Add category filter if provided (partial match)
    if (category) {
      query += ' AND needs.category LIKE ?';
      queryParams.push(`%${category}%`);
    }

    // Add search filter if provided (searches in title and description)
    if (search) {
      query += ' AND (needs.title LIKE ? OR needs.description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Order by priority (urgent first) and creation date (newest first)
    query += `
      ORDER BY 
        CASE needs.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
        END,
        needs.created_at DESC
    `;

    // Execute query
    const [needs] = await pool.query(query, queryParams);

    // Return success response with needs array
    return res.status(200).json({
      success: true,
      count: needs.length,
      needs: needs
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

    // Return the found need
    return res.status(200).json({
      success: true,
      need: needs[0]
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
      (title, description, cost, quantity, priority, category, manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [
      title.trim(),
      description || null,
      parseFloat(cost),
      parseInt(quantity),
      priority || 'normal',
      category || null,
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
      category
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

// Export all controller functions
module.exports = {
  getAllNeeds,
  getNeedById,
  createNeed,
  updateNeed,
  deleteNeed
};
