const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

// Create a new distribution/volunteer event
router.post('/', eventsController.createEvent);

// Fetch upcoming events with optional filters
router.get('/upcoming', eventsController.getUpcomingEvents);

// Fetch events tied to a specific need
router.get('/need/:needId', eventsController.getEventsForNeed);

// Volunteer signs up for an event (must come before /:id routes)
router.post('/:eventId/signup', eventsController.signupForEvent);

// Volunteer cancels their signup (must come before /:id routes)
router.post('/:eventId/cancel', eventsController.cancelSignup);

// Update an existing event
router.put('/:id', eventsController.updateEvent);

// Delete an event
router.delete('/:id', eventsController.deleteEvent);

module.exports = router;
