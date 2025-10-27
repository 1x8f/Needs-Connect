// Funding Controller
// Handles all business logic for funding/checkout operations and transaction history

const pool = require('../database/db');

/**
 * Process checkout - Convert basket items to funding records
 * 
 * This function implements a transaction-like flow:
 * 1. Validate all basket items and availability
 * 2. If all validations pass, process all funding records
 * 3. Update need quantities
 * 4. Clear the basket
 * 
 * @route POST /api/funding/checkout
 * @access Public (should be protected)
 * @body { user_id }
 */
const checkout = async (req, res) => {
  try {
    // Extract user ID from request body
    const { user_id } = req.body;

    // Validate user ID is provided
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate user ID is a number
    if (isNaN(user_id) || parseInt(user_id) < 1) {
      return res.status(400).json({
        success: false,
        message: 'User ID must be a positive number'
      });
    }

    const userIdInt = parseInt(user_id);

    // Get user's basket with need details
    const [basketItems] = await pool.query(
      `
      SELECT 
        baskets.id as basket_id,
        baskets.need_id,
        baskets.quantity as basket_quantity,
        needs.title,
        needs.cost,
        needs.quantity as need_total_quantity,
        needs.quantity_fulfilled
      FROM baskets
      LEFT JOIN needs ON baskets.need_id = needs.id
      WHERE baskets.user_id = ?
      `,
      [userIdInt]
    );

    // Check if basket is empty
    if (basketItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Basket is empty. Add items to your basket before checking out.'
      });
    }

    // VALIDATION PHASE: Check all items before processing any
    // This ensures we don't partially process a checkout that will fail
    for (const item of basketItems) {
      // Check if need still exists
      if (!item.need_id) {
        return res.status(400).json({
          success: false,
          message: `One or more items in your basket no longer exist`
        });
      }

      // Calculate available quantity
      const availableQuantity = item.need_total_quantity - item.quantity_fulfilled;

      // Check if requested quantity is available
      if (item.basket_quantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough quantity available for "${item.title}". Available: ${availableQuantity}, In basket: ${item.basket_quantity}`,
          failedItem: {
            need_id: item.need_id,
            title: item.title,
            requested: item.basket_quantity,
            available: availableQuantity
          }
        });
      }

      // Check if need is fully funded
      if (availableQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `"${item.title}" has been fully funded and is no longer available`
        });
      }
    }

    // PROCESSING PHASE: All validations passed, now process the funding
    const fundingRecords = [];
    let totalAmount = 0;

    for (const item of basketItems) {
      // Calculate amount for this funding record
      const amount = parseFloat(item.cost) * item.basket_quantity;
      totalAmount += amount;

      // Insert funding record
      const [fundingResult] = await pool.query(
        `
        INSERT INTO funding (user_id, need_id, quantity, amount)
        VALUES (?, ?, ?, ?)
        `,
        [userIdInt, item.need_id, item.basket_quantity, amount]
      );

      // Update need's quantity_fulfilled
      await pool.query(
        `
        UPDATE needs 
        SET quantity_fulfilled = quantity_fulfilled + ?
        WHERE id = ?
        `,
        [item.basket_quantity, item.need_id]
      );

      // Store funding record ID for later retrieval
      fundingRecords.push(fundingResult.insertId);
    }

    // Clear user's basket after successful funding
    await pool.query('DELETE FROM baskets WHERE user_id = ?', [userIdInt]);

    // Retrieve all created funding records with full details
    const placeholders = fundingRecords.map(() => '?').join(',');
    const [completeFundingRecords] = await pool.query(
      `
      SELECT 
        funding.id as funding_id,
        funding.quantity,
        funding.amount,
        funding.funded_at,
        needs.id as need_id,
        needs.title,
        needs.description,
        needs.cost,
        needs.priority,
        needs.category,
        users.username as manager_username
      FROM funding
      LEFT JOIN needs ON funding.need_id = needs.id
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE funding.id IN (${placeholders})
      ORDER BY funding.funded_at DESC
      `,
      fundingRecords
    );

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Checkout successful! Thank you for your contribution.',
      fundingRecords: completeFundingRecords,
      itemsProcessed: completeFundingRecords.length,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    });

  } catch (error) {
    console.error('Error in checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process checkout',
      error: error.message
    });
  }
};

/**
 * Get funding history for a specific user
 * 
 * Returns all funding records made by a user with need details
 * 
 * @route GET /api/funding/user/:userId
 * @access Public (should be protected to user's own history)
 */
const getUserFunding = async (req, res) => {
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

    // Query funding history with need and manager details
    const [fundingHistory] = await pool.query(
      `
      SELECT 
        funding.id as funding_id,
        funding.quantity,
        funding.amount,
        funding.funded_at,
        needs.id as need_id,
        needs.title,
        needs.description,
        needs.cost,
        needs.priority,
        needs.category,
        users.username as manager_username
      FROM funding
      LEFT JOIN needs ON funding.need_id = needs.id
      LEFT JOIN users ON needs.manager_id = users.id
      WHERE funding.user_id = ?
      ORDER BY funding.funded_at DESC
      `,
      [userId]
    );

    // Calculate total amount funded by this user
    const totalFunded = fundingHistory.reduce((sum, record) => {
      return sum + parseFloat(record.amount || 0);
    }, 0);

    // Return funding history
    return res.status(200).json({
      success: true,
      count: fundingHistory.length,
      fundingHistory: fundingHistory,
      totalFunded: parseFloat(totalFunded.toFixed(2))
    });

  } catch (error) {
    console.error('Error in getUserFunding:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve funding history',
      error: error.message
    });
  }
};

/**
 * Get all funding records (admin view)
 * 
 * Returns all funding records from all users with complete details
 * 
 * @route GET /api/funding/all
 * @access Public (should be protected - admin only)
 */
const getAllFunding = async (req, res) => {
  try {
    // Query all funding records with helper and manager details
    const [fundingRecords] = await pool.query(
      `
      SELECT 
        funding.id as funding_id,
        funding.quantity,
        funding.amount,
        funding.funded_at,
        helper.username as helper_username,
        needs.id as need_id,
        needs.title as need_title,
        needs.description,
        needs.cost,
        needs.priority,
        needs.category,
        manager.username as manager_username
      FROM funding
      LEFT JOIN users as helper ON funding.user_id = helper.id
      LEFT JOIN needs ON funding.need_id = needs.id
      LEFT JOIN users as manager ON needs.manager_id = manager.id
      ORDER BY funding.funded_at DESC
      `
    );

    // Calculate grand total of all funding
    const grandTotal = fundingRecords.reduce((sum, record) => {
      return sum + parseFloat(record.amount || 0);
    }, 0);

    // Return all funding records
    return res.status(200).json({
      success: true,
      count: fundingRecords.length,
      fundingRecords: fundingRecords,
      grandTotal: parseFloat(grandTotal.toFixed(2))
    });

  } catch (error) {
    console.error('Error in getAllFunding:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve all funding records',
      error: error.message
    });
  }
};

/**
 * Get funding records for a specific need
 * 
 * Returns all funding contributions made toward a specific need
 * 
 * @route GET /api/funding/need/:needId
 * @access Public
 */
const getNeedFunding = async (req, res) => {
  try {
    // Extract and validate need ID from params
    const { needId } = req.params;

    // Validate need ID is a number
    if (isNaN(needId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid need ID - must be a number'
      });
    }

    // Check if need exists
    const [needs] = await pool.query(
      'SELECT id, title FROM needs WHERE id = ?',
      [needId]
    );

    if (needs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Need not found'
      });
    }

    // Query funding records for this need with helper details
    const [fundingRecords] = await pool.query(
      `
      SELECT 
        funding.id as funding_id,
        funding.quantity,
        funding.amount,
        funding.funded_at,
        users.username as helper_username,
        users.id as helper_id
      FROM funding
      LEFT JOIN users ON funding.user_id = users.id
      WHERE funding.need_id = ?
      ORDER BY funding.funded_at DESC
      `,
      [needId]
    );

    // Calculate total amount funded for this need
    const totalFunded = fundingRecords.reduce((sum, record) => {
      return sum + parseFloat(record.amount || 0);
    }, 0);

    // Calculate total quantity funded for this need
    const totalQuantity = fundingRecords.reduce((sum, record) => {
      return sum + parseInt(record.quantity || 0);
    }, 0);

    // Return funding records for this need
    return res.status(200).json({
      success: true,
      needId: parseInt(needId),
      needTitle: needs[0].title,
      count: fundingRecords.length,
      fundingRecords: fundingRecords,
      totalFunded: parseFloat(totalFunded.toFixed(2)),
      totalQuantity: totalQuantity
    });

  } catch (error) {
    console.error('Error in getNeedFunding:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve need funding records',
      error: error.message
    });
  }
};

// Export all controller functions
module.exports = {
  checkout,
  getUserFunding,
  getAllFunding,
  getNeedFunding
};
