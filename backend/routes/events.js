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
