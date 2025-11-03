#!/usr/bin/env node

/**
 * Seed script – inserts high-priority needs and volunteer events so the
 * prioritisation dashboards have realistic baseline data.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const adminUser = {
  username: 'admin',
  role: 'manager'
};

const helperUsers = [
  { username: 'helper1', role: 'helper' },
  { username: 'helper2', role: 'helper' }
];

const seedNeeds = [
  {
    title: 'Fresh Produce Emergency Kits',
    description: 'Perishable fruits, vegetables, and dairy items for families facing food insecurity. Kits must be delivered quickly to maintain freshness.',
    cost: 18.5,
    quantity: 60,
    priority: 'urgent',
    category: 'food',
    org_type: 'food_bank',
    neededByDays: 4,
    isPerishable: true,
    bundleTag: 'basic_food',
    serviceRequired: false,
    requestCount: 3,
    events: [
      {
        event_type: 'delivery',
        daysFromNow: 3,
        durationHours: 2,
        volunteer_slots: 10,
        location: 'Downtown Community Pantry Loading Dock',
        notes: 'Bring coolers / insulated bags. Drivers must have valid ID.'
      },
      {
        event_type: 'kit_build',
        daysFromNow: 2,
        durationHours: 3,
        volunteer_slots: 12,
        location: 'Warehouse Packing Floor',
        notes: 'Gloves and hairnets provided on site.'
      }
    ]
  },
  {
    title: 'Winter Coat & Blanket Drive',
    description: 'Collect and distribute insulated coats, thermal blankets, and socks for the overnight shelter network.',
    cost: 32,
    quantity: 120,
    priority: 'high',
    category: 'clothing',
    org_type: 'homeless_shelter',
    neededByDays: 14,
    isPerishable: false,
    bundleTag: 'winter_clothing',
    serviceRequired: true,
    requestCount: 5,
    events: [
      {
        event_type: 'distribution',
        daysFromNow: 10,
        durationHours: 4,
        volunteer_slots: 15,
        location: 'Northside Shelter Gymnasium',
        notes: 'Volunteers will help assemble care packages and manage distribution tables.'
      }
    ]
  },
  {
    title: 'Neighborhood Beautification Cleanup Kits',
    description: 'Trash grabbers, rakes, mulch, and planter soil for weekend neighborhood beautification events.',
    cost: 12,
    quantity: 80,
    priority: 'normal',
    category: 'other',
    org_type: 'disaster_relief',
    neededByDays: 9,
    isPerishable: false,
    bundleTag: 'beautification',
    serviceRequired: true,
    requestCount: 2,
    events: [
      {
        event_type: 'cleanup',
        daysFromNow: 7,
        durationHours: 5,
        volunteer_slots: 25,
        location: 'Maple & 5th Street Pocket Park',
        notes: 'Outdoor event – bring water bottle, sunscreen, and wear closed-toe shoes.'
      }
    ]
  }
];

const getConnection = () =>
  mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'needs_connect',
    multipleStatements: false
  });

const toSqlDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

async function upsertUser(connection, { username, role }) {
  await connection.execute(
    `INSERT INTO users (username, role)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)` ,
    [username, role]
  );

  const [[user]] = await connection.execute('SELECT id FROM users WHERE username = ?', [username]);
  return user.id;
}

async function upsertNeed(connection, managerId, need) {
  const [existing] = await connection.execute(
    'SELECT id FROM needs WHERE manager_id = ? AND title = ?',
    [managerId, need.title]
  );

  const neededBy = need.neededByDays != null
    ? new Date(Date.now() + need.neededByDays * 24 * 60 * 60 * 1000)
    : null;

  const params = [
    need.description,
    need.cost,
    need.quantity,
    need.priority,
    need.category,
    need.org_type,
    neededBy ? neededBy.toISOString().slice(0, 10) : null,
    need.isPerishable ? 1 : 0,
    need.bundleTag,
    need.serviceRequired ? 1 : 0,
    need.requestCount
  ];

  if (existing.length > 0) {
    const needId = existing[0].id;
    await connection.execute(
      `UPDATE needs
       SET description = ?, cost = ?, quantity = ?, priority = ?, category = ?, org_type = ?, needed_by = ?, is_perishable = ?, bundle_tag = ?, service_required = ?, request_count = ?
       WHERE id = ?` ,
      [...params, needId]
    );
    return needId;
  }

  const [result] = await connection.execute(
    `INSERT INTO needs
      (title, description, cost, quantity, priority, category, org_type, needed_by, is_perishable, bundle_tag, service_required, request_count, manager_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      need.title,
      ...params,
      managerId
    ]
  );
  return result.insertId;
}

async function upsertEvent(connection, needId, event) {
  const startDate = new Date(Date.now() + event.daysFromNow * 24 * 60 * 60 * 1000);
  startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
  const endDate = new Date(startDate.getTime() + (event.durationHours || 2) * 60 * 60 * 1000);

  const eventStartSql = toSqlDateTime(startDate);
  const eventEndSql = toSqlDateTime(endDate);

  const [existing] = await connection.execute(
    `SELECT id FROM distribution_events WHERE need_id = ? AND event_type = ? AND event_start = ?` ,
    [needId, event.event_type, eventStartSql]
  );

  if (existing.length > 0) {
    const eventId = existing[0].id;
    await connection.execute(
      `UPDATE distribution_events
       SET location = ?, event_end = ?, volunteer_slots = ?, notes = ?
       WHERE id = ?` ,
      [event.location || null, eventEndSql, event.volunteer_slots || 0, event.notes || null, eventId]
    );
    return;
  }

  await connection.execute(
    `INSERT INTO distribution_events
      (need_id, event_type, location, event_start, event_end, volunteer_slots, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [needId, event.event_type, event.location || null, eventStartSql, eventEndSql, event.volunteer_slots || 0, event.notes || null]
  );
}

async function run() {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const managerId = await upsertUser(connection, adminUser);
    for (const helper of helperUsers) {
      await upsertUser(connection, helper);
    }

    for (const need of seedNeeds) {
      const needId = await upsertNeed(connection, managerId, need);

      if (Array.isArray(need.events)) {
        for (const event of need.events) {
          await upsertEvent(connection, needId, event);
        }
      }
    }

    await connection.commit();
    console.log('✅ Seed data inserted successfully.');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Failed to seed data:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();

