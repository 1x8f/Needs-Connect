# Needs Connect - Complete Codebase

This document contains all the source code for both the frontend and backend of the Needs Connect application.

---

## BACKEND CODE

### Backend Package.json
```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:start": "node scripts/start-mysql.js",
    "seed": "node scripts/seed-data.js",
    "reminders": "node scripts/send-reminders.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "mysql2": "^3.15.3"
  },
  "devDependencies": {
    "adm-zip": "^0.5.16",
    "mysql-server": "^1.0.5",
    "nodemon": "^3.1.10"
  }
}
```

### Backend Server.js
```javascript
// Import required packages
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Successfully connected to MySQL database');
});

// Import Routes
const authRoutes = require('./routes/auth');
const needsRoutes = require('./routes/needs');
const basketRoutes = require('./routes/basket');
const fundingRoutes = require('./routes/funding');
const eventsRoutes = require('./routes/events');

// Routes

// Test route to verify backend is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Needs routes
app.use('/api/needs', needsRoutes);

// Basket routes
app.use('/api/basket', basketRoutes);

// Funding routes
app.use('/api/funding', fundingRoutes);
app.use('/api/events', eventsRoutes);

// Server Configuration
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

### Database Schema (schema.sql)
```sql
-- ============================================
-- Needs Connect Database Schema
-- ============================================
-- This schema defines the database structure for the Needs Connect platform
-- which connects helpers with non-profits to fulfill their needs.

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS funding;
DROP TABLE IF EXISTS baskets;
DROP TABLE IF EXISTS needs;
DROP TABLE IF EXISTS users;

-- ============================================
-- Table: users
-- ============================================
-- Stores user information for both helpers and nonprofit managers
-- Helpers can browse and fund needs
-- Managers can create and manage needs for their organizations
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('helper', 'manager') DEFAULT 'helper',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: needs
-- ============================================
-- Stores needs/requests posted by nonprofit managers
-- Each need represents an item or service required by a nonprofit
-- Tracks fulfillment progress through quantity_fulfilled
CREATE TABLE needs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    quantity_fulfilled INT DEFAULT 0,
    priority ENUM('urgent', 'high', 'normal') DEFAULT 'normal',
    category VARCHAR(50),
    org_type VARCHAR(50) DEFAULT 'other',
    needed_by DATE,
    is_perishable TINYINT(1) DEFAULT 0,
    bundle_tag ENUM('basic_food','winter_clothing','hygiene_kit','cleaning_supplies','beautification','other') DEFAULT 'other',
    service_required TINYINT(1) DEFAULT 0,
    request_count INT DEFAULT 0,
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT check_quantity_fulfilled CHECK (quantity_fulfilled >= 0 AND quantity_fulfilled <= quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: baskets
-- ============================================
-- Stores items that helpers have added to their basket/cart
-- Represents intent to fund before actual funding is confirmed
-- Allows users to collect multiple needs before committing
CREATE TABLE baskets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    need_id INT,
    quantity INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE,
    CONSTRAINT check_basket_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: funding
-- ============================================
-- Records completed funding transactions
-- Tracks which helper funded which need and for what amount
-- This is the permanent record of contributions made
CREATE TABLE funding (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    need_id INT,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    funded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE,
    CONSTRAINT check_funding_quantity CHECK (quantity > 0),
    CONSTRAINT check_funding_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Indexes for Performance Optimization
-- ============================================
-- Create indexes on foreign keys and commonly queried columns
CREATE INDEX idx_needs_manager_id ON needs(manager_id);
CREATE INDEX idx_needs_priority ON needs(priority);
CREATE INDEX idx_needs_category ON needs(category);
CREATE INDEX idx_needs_needed_by ON needs(needed_by);
CREATE INDEX idx_needs_bundle_tag ON needs(bundle_tag);
CREATE INDEX idx_needs_request_count ON needs(request_count);
CREATE INDEX idx_baskets_user_id ON baskets(user_id);
CREATE INDEX idx_baskets_need_id ON baskets(need_id);
CREATE INDEX idx_funding_user_id ON funding(user_id);
CREATE INDEX idx_funding_need_id ON funding(need_id);

-- ============================================
-- Table: distribution_events
-- ============================================
-- Schedules volunteer-driven activities tied to a need
CREATE TABLE distribution_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    need_id INT NOT NULL,
    event_type ENUM('delivery','cleanup','kit_build','distribution') NOT NULL,
    location VARCHAR(150),
    event_start DATETIME NOT NULL,
    event_end DATETIME,
    volunteer_slots INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: event_volunteers
-- ============================================
-- Tracks volunteer sign-ups for each distribution event
CREATE TABLE event_volunteers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('confirmed','waitlist','cancelled') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES distribution_events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_event_user (event_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for events
CREATE INDEX idx_events_need_id ON distribution_events(need_id);
CREATE INDEX idx_events_event_start ON distribution_events(event_start);
CREATE INDEX idx_event_volunteers_event_id ON event_volunteers(event_id);
CREATE INDEX idx_event_volunteers_user_id ON event_volunteers(user_id);

-- ============================================
-- Schema Setup Complete
-- ============================================
```

### Database Connection Pool (database/db.js)
```javascript
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
    console.log('Database pool created successfully');
    connection.release(); // Release connection back to pool
  })
  .catch(err => {
    console.error('Error creating database pool:', err.message);
  });

// Export the pool for use in other modules
// Use pool.query() or pool.execute() for database operations
module.exports = pool;
```

### Authentication Controller (controllers/authController.js)
```javascript
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
```

### Authentication Routes (routes/auth.js)
```javascript
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
```

### Needs Controller (controllers/needsController.js)
[Due to length, this file is 842 lines. The key functions are: getAllNeeds, getNeedById, createNeed, updateNeed, deleteNeed, getUrgentNeeds, getBundleNeeds, getBeautificationNeeds. It includes urgency scoring, filtering, and sorting logic.]

### Needs Routes (routes/needs.js)
```javascript
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
```

### Basket Controller (controllers/basketController.js)
[485 lines - handles getBasket, addToBasket, updateBasketItem, removeFromBasket, clearBasket]

### Basket Routes (routes/basket.js)
```javascript
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
```

### Funding Controller (controllers/fundingController.js)
[399 lines - handles checkout, getUserFunding, getAllFunding, getNeedFunding]

### Funding Routes (routes/funding.js)
```javascript
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
```

### Events Controller (controllers/eventsController.js)
[376 lines - handles createEvent, getUpcomingEvents, getEventsForNeed, signupForEvent, cancelSignup]

### Events Routes (routes/events.js)
```javascript
const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

// Create a new distribution/volunteer event
router.post('/', eventsController.createEvent);

// Fetch upcoming events with optional filters
router.get('/upcoming', eventsController.getUpcomingEvents);

// Fetch events tied to a specific need
router.get('/need/:needId', eventsController.getEventsForNeed);

// Volunteer signs up for an event
router.post('/:eventId/signup', eventsController.signupForEvent);

// Volunteer cancels their signup
router.post('/:eventId/cancel', eventsController.cancelSignup);

module.exports = router;
```

### Middleware (middleware/auth.js)
```javascript
// Authentication Middleware
// Provides middleware functions for protecting routes and verifying user roles

/**
 * Middleware to require manager role
 * 
 * This middleware will be used to protect routes that only managers can access
 * (e.g., creating needs, updating needs, etc.)
 * 
 * TODO: Implement full authentication check
 * - Verify user is authenticated
 * - Check if user role is 'manager'
 * - Return 403 if not authorized
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireManager = (req, res, next) => {
  // Placeholder for future implementation
  // Will check if req.user.role === 'manager'
  next();
};

/**
 * Middleware to verify any authenticated user
 * 
 * This middleware will verify that a user is logged in
 * Used for routes that require authentication but not a specific role
 * 
 * TODO: Implement authentication check
 * - Verify user session/token
 * - Attach user data to req.user
 * - Return 401 if not authenticated
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAuth = (req, res, next) => {
  // Placeholder for future implementation
  next();
};

// Export middleware functions
module.exports = {
  requireManager,
  requireAuth
};
```

### Seed Data Script (scripts/seed-data.js)
[240 lines - creates sample users, needs, and events for testing]

### Setup Database Script (setup-db.js)
[92 lines - creates database and runs schema]

---

## FRONTEND CODE

### Frontend Package.json
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "lucide-react": "^0.548.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.4",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.1"
  }
}
```

### Frontend Entry Point (src/index.js)
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

### Main App Component (src/App.js)
[101 lines - sets up routing, protected routes, and page transitions]

### API Service (src/services/api.js)
[302 lines - all API calls including login, needs, basket, funding, events]

### Auth Context (src/context/AuthContext.js)
[79 lines - manages authentication state and user session]

### Navigation Component (src/components/Navigation.js)
[85 lines - navigation bar with basket count]

### Login Page (src/pages/Login.js)
[250 lines - login form with help section]

### Needs List Page (src/pages/NeedsList.js)
[377 lines - displays needs with filters and add to basket functionality]

### Needs List New Page (src/pages/NeedsListNew.js)
[643 lines - alternative needs list with collapsible sections]

### Basket Page (src/pages/Basket.js)
[243 lines - shopping cart with checkout]

### Manager Dashboard (src/pages/ManagerDashboard.js)
[411 lines - manager view of needs with stats and filters]

### Add Need Page (src/pages/AddNeed.js)
[500 lines - form to create new needs]

### Edit Need Page (src/pages/EditNeed.js)
[558 lines - form to edit existing needs]

### Manager Events Page (src/pages/ManagerEvents.js)
[479 lines - schedule and manage volunteer events]

### Volunteer Opportunities Page (src/pages/VolunteerOpportunities.js)
[390 lines - browse and sign up for volunteer events]

### Shelter Impact Dashboard Component (src/components/ShelterImpactDashboard.js)
[120 lines - shows aggregate impact for animal shelters]

### Adoption Impact Tracker Component (src/components/AdoptionImpactTracker.js)
[209 lines - tracks adoption readiness for individual needs]

### Error Boundary (src/ErrorBoundary.js)
[42 lines - React error boundary component]

### Main CSS (src/index.css)
[348 lines - Tailwind setup, animations, custom styles]

### App CSS (src/App.css)
[39 lines - basic app styles]

### Tailwind Config (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a0a0a',
        secondary: '#1a1a1a',
        accent: '#00ffff',
        glow: '#00ffff',
      },
      animation: {
        'subtle-float': 'subtle-float 8s ease-in-out infinite',
        'aurora': 'aurora 20s ease-in-out infinite alternate',
        'sparkle': 'sparkle 5s ease-in-out infinite alternate',
      },
      keyframes: {
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-10px) translateX(5px)' },
        },
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
```

### PostCSS Config (postcss.config.js)
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Public HTML (public/index.html)
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

---

## ENVIRONMENT SETUP

### Backend .env file (create this file)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=needs_connect
```

---

## NOTES

- The backend uses Express 5 with MySQL2
- The frontend uses React 19 with React Router
- Authentication is trust-based (username only, no password)
- "admin" username gets manager role, all others get helper role
- The database schema includes tables for users, needs, baskets, funding, distribution_events, and event_volunteers
- Full CRUD operations for needs
- Basket/cart functionality
- Funding/checkout system
- Volunteer event scheduling and signup system
- Urgency scoring algorithm for prioritizing needs
- Bundle tagging for grouping related needs

---

## TO RUN:

1. Backend: `cd backend && npm install && npm start`
2. Frontend: `cd frontend && npm install && npm start`
3. Database: Run `npm run db:start` in backend directory (uses bundled MariaDB)
4. Seed data: Run `npm run seed` in backend directory (optional)

