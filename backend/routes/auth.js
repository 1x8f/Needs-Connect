// Authentication Routes
// Defines API endpoints for user authentication

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @route   POST /api/auth/login
 * @desc    Login or register a user
 * @access  Public
 * @body    { username: string }
 */
router.post('/login', authController.login);

// Export router to be used in main server file
module.exports = router;
