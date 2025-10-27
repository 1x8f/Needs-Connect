// Basket Controller
// Handles all business logic for managing user baskets (shopping cart functionality)

const pool = require('../database/db');

/**
 * Get user's basket with all items and totals
 * 
 * Returns basket items with need details and calculated totals
 * 
 * @route GET /api/basket/:userId
 * @access Public (should be protected to user's own basket)
 */
const getBasket = async (req, res) => {
  try {
    // Extract and validate user ID from params
    const { userId } = req.params;

    // Validate user ID is a number
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID - must be a number'
      });
    }

    // Query basket items with need details and manager information
    const query = `
      SELECT 
        baskets.id as basket_id,
        baskets.quantity as basket_quantity,
        baskets.added_at,
        needs.id as need_id,
        needs.title,
        needs.description,
        needs.cost,
        needs.quantity as total_quantity,
        needs.quantity_fulfilled,
        needs.priority,
        needs.category,
        users.username as manager_username,
        (needs.quantity - needs.quantity_fulfilled) as available_quantity,
        (needs.cost * baskets.quantity) as item_total
      FROM baskets
      LEFT JOIN needs ON baskets.need_id = needs.id
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE baskets.user_id = ?
      ORDER BY baskets.added_at DESC
    `;

    const [basketItems] = await pool.query(query, [userId]);

    // Calculate total cost of all items in basket
    const totalCost = basketItems.reduce((sum, item) => {
      return sum + parseFloat(item.item_total || 0);
    }, 0);

    // Return basket with items and total
    return res.status(200).json({
      success: true,
      count: basketItems.length,
      basket: basketItems,
      totalCost: parseFloat(totalCost.toFixed(2))
    });

  } catch (error) {
    console.error('Error in getBasket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve basket',
      error: error.message
    });
  }
};

/**
 * Add item to basket (or update quantity if already exists)
 * 
 * Validates availability and prevents over-allocation
 * 
 * @route POST /api/basket
 * @access Public (should be protected)
 * @body { user_id, need_id, quantity }
 */
const addToBasket = async (req, res) => {
  try {
    // Extract fields from request body
    const { user_id, need_id, quantity } = req.body;

    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!need_id) {
      return res.status(400).json({
        success: false,
        message: 'Need ID is required'
      });
    }

    if (!quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    // Validate user_id is a positive number
    if (isNaN(user_id) || parseInt(user_id) < 1) {
      return res.status(400).json({
        success: false,
        message: 'User ID must be a positive number'
      });
    }

    // Validate need_id is a positive number
    if (isNaN(need_id) || parseInt(need_id) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Need ID must be a positive number'
      });
    }

    // Validate quantity is a positive number
    if (isNaN(quantity) || parseInt(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number (at least 1)'
      });
    }

    const requestedQuantity = parseInt(quantity);
    const userIdInt = parseInt(user_id);
    const needIdInt = parseInt(need_id);

    // Check if need exists and get its details
    const [needs] = await pool.query(
      'SELECT id, title, quantity, quantity_fulfilled FROM needs WHERE id = ?',
      [needIdInt]
    );

    if (needs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Need not found'
      });
    }

    const need = needs[0];

    // Calculate available quantity
    const availableQuantity = need.quantity - need.quantity_fulfilled;

    if (availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This need has been fully funded and is no longer available'
      });
    }

    // Check if item is already in the user's basket
    const [existingItems] = await pool.query(
      'SELECT id, quantity FROM baskets WHERE user_id = ? AND need_id = ?',
      [userIdInt, needIdInt]
    );

    let basketItemId;

    if (existingItems.length > 0) {
      // Item already in basket - update quantity
      const existingItem = existingItems[0];
      const newTotalQuantity = existingItem.quantity + requestedQuantity;

      // Check if new total quantity exceeds available quantity
      if (newTotalQuantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough quantity available. You already have ${existingItem.quantity} in your basket. Available: ${availableQuantity}, Requested total: ${newTotalQuantity}`
        });
      }

      // Update basket item quantity
      await pool.query(
        'UPDATE baskets SET quantity = quantity + ? WHERE id = ?',
        [requestedQuantity, existingItem.id]
      );

      basketItemId = existingItem.id;

    } else {
      // New item - check if requested quantity is available
      if (requestedQuantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough quantity available. Available: ${availableQuantity}, Requested: ${requestedQuantity}`
        });
      }

      // Insert new basket item
      const [result] = await pool.query(
        'INSERT INTO baskets (user_id, need_id, quantity) VALUES (?, ?, ?)',
        [userIdInt, needIdInt, requestedQuantity]
      );

      basketItemId = result.insertId;
    }

    // Retrieve the basket item with full need details
    const [basketItem] = await pool.query(
      `
      SELECT 
        baskets.id as basket_id,
        baskets.quantity as basket_quantity,
        baskets.added_at,
        needs.id as need_id,
        needs.title,
        needs.description,
        needs.cost,
        needs.quantity as total_quantity,
        needs.quantity_fulfilled,
        needs.priority,
        needs.category,
        users.username as manager_username,
        (needs.quantity - needs.quantity_fulfilled) as available_quantity,
        (needs.cost * baskets.quantity) as item_total
      FROM baskets
      LEFT JOIN needs ON baskets.need_id = needs.id
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE baskets.id = ?
      `,
      [basketItemId]
    );

    // Return success response
    return res.status(existingItems.length > 0 ? 200 : 201).json({
      success: true,
      message: existingItems.length > 0 ? 'Basket updated' : 'Added to basket',
      basketItem: basketItem[0]
    });

  } catch (error) {
    console.error('Error in addToBasket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to basket',
      error: error.message
    });
  }
};

/**
 * Update basket item quantity
 * 
 * Validates new quantity against available quantity
 * 
 * @route PUT /api/basket/:id
 * @access Public (should be protected)
 * @body { quantity }
 */
const updateBasketItem = async (req, res) => {
  try {
    // Extract basket item ID from params
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid basket item ID - must be a number'
      });
    }

    // Extract new quantity from body
    const { quantity } = req.body;

    // Validate quantity is provided
    if (!quantity && quantity !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required'
      });
    }

    // Validate quantity is a positive number
    if (isNaN(quantity) || parseInt(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number (at least 1)'
      });
    }

    const newQuantity = parseInt(quantity);

    // Check if basket item exists and get need details
    const [basketItems] = await pool.query(
      `
      SELECT 
        baskets.id,
        baskets.need_id,
        baskets.quantity,
        needs.quantity as need_quantity,
        needs.quantity_fulfilled,
        needs.title
      FROM baskets
      LEFT JOIN needs ON baskets.need_id = needs.id
      WHERE baskets.id = ?
      `,
      [id]
    );

    if (basketItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Basket item not found'
      });
    }

    const basketItem = basketItems[0];

    // Calculate available quantity
    const availableQuantity = basketItem.need_quantity - basketItem.quantity_fulfilled;

    // Check if new quantity exceeds available quantity
    if (newQuantity > availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Not enough quantity available. Available: ${availableQuantity}, Requested: ${newQuantity}`
      });
    }

    // Update basket item quantity
    await pool.query(
      'UPDATE baskets SET quantity = ? WHERE id = ?',
      [newQuantity, id]
    );

    // Retrieve updated basket item with full details
    const [updatedItem] = await pool.query(
      `
      SELECT 
        baskets.id as basket_id,
        baskets.quantity as basket_quantity,
        baskets.added_at,
        needs.id as need_id,
        needs.title,
        needs.description,
        needs.cost,
        needs.quantity as total_quantity,
        needs.quantity_fulfilled,
        needs.priority,
        needs.category,
        users.username as manager_username,
        (needs.quantity - needs.quantity_fulfilled) as available_quantity,
        (needs.cost * baskets.quantity) as item_total
      FROM baskets
      LEFT JOIN needs ON baskets.need_id = needs.id
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE baskets.id = ?
      `,
      [id]
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Basket item updated',
      basketItem: updatedItem[0]
    });

  } catch (error) {
    console.error('Error in updateBasketItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update basket item',
      error: error.message
    });
  }
};

/**
 * Remove item from basket
 * 
 * @route DELETE /api/basket/:id
 * @access Public (should be protected)
 */
const removeFromBasket = async (req, res) => {
  try {
    // Extract basket item ID from params
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid basket item ID - must be a number'
      });
    }

    // Check if basket item exists
    const [existingItems] = await pool.query(
      'SELECT id FROM baskets WHERE id = ?',
      [id]
    );

    if (existingItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Basket item not found'
      });
    }

    // Delete basket item
    await pool.query('DELETE FROM baskets WHERE id = ?', [id]);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Item removed from basket'
    });

  } catch (error) {
    console.error('Error in removeFromBasket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove item from basket',
      error: error.message
    });
  }
};

/**
 * Clear all items from user's basket
 * 
 * @route DELETE /api/basket/clear/:userId
 * @access Public (should be protected to user's own basket)
 */
const clearBasket = async (req, res) => {
  try {
    // Extract user ID from params
    const { userId } = req.params;

    // Validate user ID is a number
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID - must be a number'
      });
    }

    // Delete all basket items for this user
    const [result] = await pool.query(
      'DELETE FROM baskets WHERE user_id = ?',
      [userId]
    );

    // Return success response with count of items removed
    return res.status(200).json({
      success: true,
      message: 'Basket cleared',
      itemsRemoved: result.affectedRows
    });

  } catch (error) {
    console.error('Error in clearBasket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear basket',
      error: error.message
    });
  }
};

// Export all controller functions
module.exports = {
  getBasket,
  addToBasket,
  updateBasketItem,
  removeFromBasket,
  clearBasket
};
