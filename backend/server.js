/**
 * Needs Connect Backend Server
 * 
 * Main entry point for the Express.js REST API server.
 * Handles routing, middleware configuration, and server initialization.
 * 
 * Architecture:
 * - Express.js for HTTP server and routing
 * - MySQL connection pooling for efficient database operations
 * - RESTful API design with clear separation of concerns
 * - CORS enabled for frontend communication
 * 
 * @module server
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize database connection pool
// This import ensures the database connection is established on server startup
// The pool is exported and used by all controllers for database operations
require('./database/db');

// Initialize Express application
const app = express();

// ============================================
// Middleware Configuration
// ============================================

// CORS: Enable Cross-Origin Resource Sharing for frontend communication
// Allows the React frontend (localhost:3000) to make API requests
app.use(cors());

// JSON Parser: Parse incoming request bodies as JSON
// Required for POST/PUT requests with JSON payloads
app.use(express.json());

// ============================================
// Route Imports
// ============================================
// Each route module handles a specific domain:
// - auth: User authentication and registration
// - needs: Need management (CRUD operations)
// - basket: Shopping cart functionality
// - funding: Checkout and transaction processing
// - events: Volunteer event management

const authRoutes = require('./routes/auth');
const needsRoutes = require('./routes/needs');
const basketRoutes = require('./routes/basket');
const fundingRoutes = require('./routes/funding');
const eventsRoutes = require('./routes/events');

// ============================================
// API Routes
// ============================================

/**
 * Health Check Endpoint
 * Simple endpoint to verify the server is running
 * Useful for monitoring and debugging
 */
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Mount route handlers
app.use('/api/auth', authRoutes);      // Authentication endpoints
app.use('/api/needs', needsRoutes);    // Needs management endpoints
app.use('/api/basket', basketRoutes);  // Shopping cart endpoints
app.use('/api/funding', fundingRoutes); // Checkout and funding endpoints
app.use('/api/events', eventsRoutes);  // Volunteer event endpoints

// ============================================
// Server Configuration & Startup
// ============================================

/**
 * Server Port Configuration
 * Uses PORT from environment variables or defaults to 5000
 * This allows flexibility for different deployment environments
 */
const PORT = process.env.PORT || 5000;

/**
 * Start the Express server
 * Listens on the configured port and logs server information
 */
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('🚀 Needs Connect Backend Server');
  console.log('='.repeat(50));
  console.log(`✓ Server is running on http://localhost:${PORT}`);
  console.log(`✓ API endpoints available at http://localhost:${PORT}/api`);
  console.log(`✓ Test endpoint: http://localhost:${PORT}/api/test`);
  console.log('');
  console.log('💡 Make sure the frontend is running on http://localhost:3000');
  console.log('='.repeat(50));
  console.log('');
});


