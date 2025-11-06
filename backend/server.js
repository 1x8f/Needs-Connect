// Import required packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database pool (used by controllers)
// This ensures the database connection is initialized
require('./database/db');

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies

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


