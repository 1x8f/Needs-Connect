// Funding Routes
// Defines API endpoints for funding/checkout operations and transaction history

const express = require('express');
const router = express.Router();
const fundingController = require('../controllers/fundingController');

/**
 * @route   POST /api/funding/checkout
 * @desc    Process checkout - convert basket to funding records
 * @access  Public (should be protected)
 * @body    { user_id }
 */
router.post('/checkout', fundingController.checkout);

/**
 * @route   GET /api/funding/user/:userId
 * @desc    Get funding history for a specific user
 * @access  Public (should be protected to user's own history)
 */
router.get('/user/:userId', fundingController.getUserFunding);

/**
 * @route   GET /api/funding/all
 * @desc    Get all funding records (admin view)
 * @access  Public (should be protected - admin only)
 */
router.get('/all', fundingController.getAllFunding);

/**
 * @route   GET /api/funding/need/:needId
 * @desc    Get funding records for a specific need
 * @access  Public
 */
router.get('/need/:needId', fundingController.getNeedFunding);

// Export router to be used in main server file
module.exports = router;
