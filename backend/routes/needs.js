// Needs Routes
// Defines API endpoints for managing needs (CRUD operations)

const express = require('express');
const router = express.Router();
const needsController = require('../controllers/needsController');

/**
 * @route   GET /api/needs
 * @desc    Get all needs with optional filtering
 * @access  Public
 * @query   priority, category, search
 */
router.get('/', needsController.getAllNeeds);

/**
 * @route   GET /api/needs/:id
 * @desc    Get a single need by ID
 * @access  Public
 */
router.get('/:id', needsController.getNeedById);

/**
 * @route   POST /api/needs
 * @desc    Create a new need
 * @access  Manager only (protected)
 * @body    { title, description, cost, quantity, priority, category, manager_id }
 */
router.post('/', needsController.createNeed);

/**
 * @route   PUT /api/needs/:id
 * @desc    Update an existing need
 * @access  Manager only (protected)
 * @body    Any fields to update
 */
router.put('/:id', needsController.updateNeed);

/**
 * @route   DELETE /api/needs/:id
 * @desc    Delete a need
 * @access  Manager only (protected)
 */
router.delete('/:id', needsController.deleteNeed);

// Export router to be used in main server file
module.exports = router;
