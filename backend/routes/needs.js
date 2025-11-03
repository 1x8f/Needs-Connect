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
 * @route   GET /api/needs/urgent
 * @desc    Get top urgent/time-sensitive needs
 */
router.get('/urgent', needsController.getUrgentNeeds);

/**
 * @route   GET /api/needs/bundle/:bundleTag
 * @desc    Get needs grouped by bundle tag (e.g. hygiene kits)
 */
router.get('/bundle/:bundleTag', needsController.getBundleNeeds);

/**
 * @route   GET /api/needs/beautification
 * @desc    Get beautification/service tasks
 */
router.get('/beautification', needsController.getBeautificationNeeds);

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
