// Database Connection Pool Configuration
// This file creates and exports a MySQL connection pool for efficient database operations
// Using mysql2/promise for async/await support

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Create a connection pool for MySQL database
 * 
 * Benefits of using a pool:
 * - Reuses connections instead of creating new ones for each query
 * - Manages connection lifecycle automatically
 * - Improves performance and reduces overhead
 * - Handles concurrent requests efficiently
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,           // Database host (e.g., localhost)
  user: process.env.DB_USER,           // Database username
  password: process.env.DB_PASSWORD,   // Database password
  database: process.env.DB_NAME,       // Database name
  waitForConnections: true,            // Wait for available connection if pool is full
  connectionLimit: 10,                 // Maximum number of connections in pool
  queueLimit: 0                        // Unlimited queued connection requests (0 = no limit)
});

/**
 * Test database connection on startup
 * This helps identify connection issues early
 */
pool.getConnection()
  .then(connection => {
    console.log('✓ Database pool created successfully');
    console.log(`  Connected to: ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'needs_connect'}`);
    connection.release(); // Release connection back to pool
  })
  .catch(err => {
    console.error('✗ Error creating database pool:', err.message);
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('1. Make sure the database server is running (npm run db:start)');
    console.error('2. Check that .env file exists in backend/ directory');
    console.error('3. Verify DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in .env');
    console.error('4. Wait 10-15 seconds after starting database before starting backend');
    console.error('5. Run "node setup-db.js" to initialize the database schema');
    console.error('');
    console.error('Full error:', err.code || err.message);
  });

// Export the pool for use in other modules
// Use pool.query() or pool.execute() for database operations
module.exports = pool;

