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


