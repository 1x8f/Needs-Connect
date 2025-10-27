// Authentication Controller
// Handles user authentication and registration logic

const pool = require('../database/db');

/**
 * Login/Register User
 * 
 * This function handles both login and automatic registration:
 * - If user exists: Returns existing user data
 * - If user doesn't exist: Creates new user and returns data
 * 
 * Role assignment:
 * - "admin" username → "manager" role
 * - Any other username → "helper" role
 * 
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    // Extract username from request body
    const { username } = req.body;

    // Validate username is provided
    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Determine user role based on username
    // Admin gets manager role, everyone else gets helper role
    const role = username.toLowerCase() === 'admin' ? 'manager' : 'helper';

    // Check if user already exists in database
    const [existingUsers] = await pool.query(
      'SELECT id, username, role FROM users WHERE username = ?',
      [username]
    );

    // If user exists, return their data
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }

    // User doesn't exist, create new user
    const [result] = await pool.query(
      'INSERT INTO users (username, role) VALUES (?, ?)',
      [username, role]
    );

    // Get the newly created user's ID
    const userId = result.insertId;

    // Return success response with new user data
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        username: username,
        role: role
      }
    });

  } catch (error) {
    // Log error for debugging
    console.error('Error in login controller:', error);

    // Return error response
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: error.message
    });
  }
};

// Export controller functions
module.exports = {
  login
};
