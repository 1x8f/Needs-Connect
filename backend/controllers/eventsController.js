const pool = require('../database/db');

const EVENT_TYPES = new Set(['delivery', 'cleanup', 'kit_build', 'distribution']);
const BUNDLE_TAG_SET = ['basic_food', 'winter_clothing', 'hygiene_kit', 'cleaning_supplies', 'beautification', 'other'];
const BUNDLE_TAGS = new Set(BUNDLE_TAG_SET);

const normalizeEvent = (event) => {
  const volunteer_slots = event.volunteer_slots !== null ? Number(event.volunteer_slots) : 0;
  const confirmed_count = Number(event.confirmed_count || 0);
  const waitlist_count = Number(event.waitlist_count || 0);
  const user_status = event.user_status || null;

  return {
    ...event,
    volunteer_slots,
    confirmed_count,
    waitlist_count,
    remaining_slots: volunteer_slots > 0 ? Math.max(volunteer_slots - confirmed_count, 0) : null,
    user_status,
    is_confirmed: user_status === 'confirmed',
    is_waitlisted: user_status === 'waitlist'
  };
};

const createEvent = async (req, res) => {
  try {
    const {
      need_id,
      event_type,
      event_start,
      event_end,
      location,
      volunteer_slots,
      notes
    } = req.body;

    if (!need_id || !event_type || !event_start) {
      return res.status(400).json({
        success: false,
        message: 'need_id, event_type, and event_start are required'
      });
    }

    if (!EVENT_TYPES.has(event_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event_type value'
      });
    }

    const [needRows] = await pool.query('SELECT id, title FROM needs WHERE id = ?', [need_id]);
    if (needRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Associated need not found'
      });
    }

    const startDate = new Date(event_start);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'event_start must be a valid date/time'
      });
    }

    let endDateValue = null;
    if (event_end) {
      const endDate = new Date(event_end);
      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'event_end must be a valid date/time'
        });
      }
      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: 'event_end cannot be earlier than event_start'
        });
      }
      endDateValue = endDate.toISOString().slice(0, 19).replace('T', ' ');
    }

    const slots = volunteer_slots !== undefined ? parseInt(volunteer_slots, 10) : 0;
    if (volunteer_slots !== undefined && (Number.isNaN(slots) || slots < 0)) {
      return res.status(400).json({
        success: false,
        message: 'volunteer_slots must be 0 or greater'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO distribution_events 
        (need_id, event_type, location, event_start, event_end, volunteer_slots, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [
        need_id,
        event_type,
        location || null,
        startDate.toISOString().slice(0, 19).replace('T', ' '),
        endDateValue,
        slots,
        notes || null
      ]
    );

    const [createdRows] = await pool.query(
      `SELECT 
         e.*, 
         n.title AS need_title,
         n.priority,
         n.bundle_tag,
         (SELECT COUNT(*) FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.status = 'confirmed') AS confirmed_count,
         (SELECT COUNT(*) FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.status = 'waitlist') AS waitlist_count
       FROM distribution_events e
       LEFT JOIN needs n ON e.need_id = n.id
       WHERE e.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Distribution event created',
      event: normalizeEvent(createdRows[0])
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

const getUpcomingEvents = async (req, res) => {
  try {
    const {
      eventType,
      bundle,
      includePast,
      limit,
      managerId,
      userId
    } = req.query;

    let selectClause = `
      SELECT 
        e.*, 
        n.title AS need_title,
        n.priority,
        n.bundle_tag,
        n.category,
        n.service_required,
        n.manager_id,
        (SELECT COUNT(*) FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.status = 'confirmed') AS confirmed_count,
        (SELECT COUNT(*) FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.status = 'waitlist') AS waitlist_count
    `;

    const params = [];

    if (userId) {
      selectClause += `,
        (SELECT ev.status FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.user_id = ? LIMIT 1) AS user_status
      `;
      params.push(userId);
    }

    let query = `${selectClause}
      FROM distribution_events e
      LEFT JOIN needs n ON e.need_id = n.id
      WHERE 1=1
    `;

    if (includePast !== 'true') {
      query += ' AND (e.event_start IS NULL OR e.event_start >= NOW())';
    }

    if (eventType) {
      if (!EVENT_TYPES.has(eventType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event type filter'
        });
      }
      query += ' AND e.event_type = ?';
      params.push(eventType);
    }

    if (bundle && BUNDLE_TAGS.has(bundle)) {
      query += ' AND n.bundle_tag = ?';
      params.push(bundle);
    }

    if (managerId) {
      query += ' AND n.manager_id = ?';
      params.push(managerId);
    }

    query += ' ORDER BY e.event_start ASC';

    if (limit) {
      const limitValue = parseInt(limit, 10);
      if (!Number.isNaN(limitValue) && limitValue > 0) {
        query += ' LIMIT ?';
        params.push(limitValue);
      }
    }

    const [events] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: events.length,
      events: events.map(normalizeEvent)
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load events',
      error: error.message
    });
  }
};

const getEventsForNeed = async (req, res) => {
  try {
    const { needId } = req.params;
    const { userId } = req.query;

    let query = `
      SELECT 
         e.*, 
         (SELECT COUNT(*) FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.status = 'confirmed') AS confirmed_count,
         (SELECT COUNT(*) FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.status = 'waitlist') AS waitlist_count
    `;

    const params = [];

    if (userId) {
      query += `,
         (SELECT ev.status FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.user_id = ? LIMIT 1) AS user_status
      `;
      params.push(userId);
    }

    query += `
       FROM distribution_events e
       WHERE e.need_id = ?
       ORDER BY e.event_start ASC`;

    params.push(needId);

    const [events] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: events.length,
      events: events.map(normalizeEvent)
    });
  } catch (error) {
    console.error('Error fetching need events:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load events for need',
      error: error.message
    });
  }
};

const signupForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required to sign up'
      });
    }

    const [[event]] = await pool.query(
      `SELECT 
         e.*, 
         (SELECT COUNT(*) FROM event_volunteers ev WHERE ev.event_id = e.id AND ev.status = 'confirmed') AS confirmed_count
       FROM distribution_events e
       WHERE e.id = ?`,
      [eventId]
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const capacity = event.volunteer_slots !== null ? Number(event.volunteer_slots) : 0;
    const confirmedCount = Number(event.confirmed_count || 0);
    const status = capacity > 0 && confirmedCount >= capacity ? 'waitlist' : 'confirmed';

    await pool.query(
      `INSERT INTO event_volunteers (event_id, user_id, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)` ,
      [eventId, user_id, status]
    );

    return res.status(200).json({
      success: true,
      message: status === 'confirmed'
        ? 'Volunteer spot confirmed'
        : 'Event is at capacity. You have been added to the waitlist.',
      status
    });
  } catch (error) {
    console.error('Error signing up for event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sign up for event',
      error: error.message
    });
  }
};

const cancelSignup = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required to cancel signup'
      });
    }

    const [result] = await pool.query(
      'UPDATE event_volunteers SET status = "cancelled" WHERE event_id = ? AND user_id = ?',
      [eventId, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Signup not found for this user'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Signup cancelled',
      status: 'cancelled'
    });
  } catch (error) {
    console.error('Error cancelling signup:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel signup',
      error: error.message
    });
  }
};

module.exports = {
  createEvent,
  getUpcomingEvents,
  getEventsForNeed,
  signupForEvent,
  cancelSignup
};

