// Basket Routes
// Defines API endpoints for managing user shopping baskets

const express = require('express');
const router = express.Router();
const basketController = require('../controllers/basketController');

/**
 * @route   GET /api/basket/:userId
 * @desc    Get user's basket with all items and totals
 * @access  Public (should be protected to user's own basket)
 */
router.get('/:userId', basketController.getBasket);

/**
 * @route   POST /api/basket
 * @desc    Add item to basket (or update if already exists)
 * @access  Public (should be protected)
 * @body    { user_id, need_id, quantity }
 */
router.post('/', basketController.addToBasket);

/**
 * @route   PUT /api/basket/:id
 * @desc    Update basket item quantity
 * @access  Public (should be protected)
 * @body    { quantity }
 */
router.put('/:id', basketController.updateBasketItem);

/**
 * @route   DELETE /api/basket/:id
 * @desc    Remove item from basket
 * @access  Public (should be protected)
 */
router.delete('/:id', basketController.removeFromBasket);

/**
 * @route   DELETE /api/basket/clear/:userId
 * @desc    Clear all items from user's basket
 * @access  Public (should be protected to user's own basket)
 */
router.delete('/clear/:userId', basketController.clearBasket);

// Export router to be used in main server file
module.exports = router;
