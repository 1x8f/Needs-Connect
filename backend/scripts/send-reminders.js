#!/usr/bin/env node

/**
 * Reminder script – fetches upcoming needs that are close to their deadlines
 * or perishable and prints an actionable summary. In a production environment
 * this could be wired into an email/SMS service.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DAYS_WARNING = 3;
const PERISHABLE_WARNING = 5;

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'needs_connect'
  });

  try {
    const [rows] = await connection.execute(
      `SELECT
         n.id,
         n.title,
         n.priority,
         n.category,
         n.needed_by,
         n.is_perishable,
         n.bundle_tag,
         n.service_required,
         n.quantity,
         n.quantity_fulfilled,
         TIMESTAMPDIFF(DAY, CURDATE(), n.needed_by) AS days_until_due,
         u.username AS manager_username
       FROM needs n
       LEFT JOIN users u ON n.manager_id = u.id
       WHERE (
         n.needed_by IS NOT NULL AND n.needed_by <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       )
       OR (
         n.is_perishable = 1 AND (n.needed_by IS NULL OR n.needed_by <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
       )
       OR (
         n.service_required = 1 AND n.needed_by IS NOT NULL AND n.needed_by <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       )
       ORDER BY n.needed_by IS NULL, n.needed_by ASC, n.priority DESC` ,
      [DAYS_WARNING, PERISHABLE_WARNING]
    );

    if (rows.length === 0) {
      console.log('All clear – no upcoming reminder-worthy needs found.');
      return;
    }

    console.log('Upcoming needs requiring attention:\n');
    rows.forEach((row) => {
      const remaining = Math.max(0, Number(row.quantity || 0) - Number(row.quantity_fulfilled || 0));
      const due = row.needed_by ? new Date(row.needed_by).toLocaleDateString() : 'Flexible';
      const flags = [];
      if (row.is_perishable) flags.push('Perishable');
      if (row.service_required) flags.push('Volunteer');
      if (row.bundle_tag && row.bundle_tag !== 'other') flags.push(`Bundle: ${row.bundle_tag.replace('_', ' ')}`);

      console.log(`• Need #${row.id}: ${row.title}`);
      console.log(`  Manager: ${row.manager_username || 'unassigned'} | Priority: ${row.priority}`);
      console.log(`  Due: ${due} (${row.days_until_due != null ? `${row.days_until_due} days remaining` : 'no deadline'})`);
      console.log(`  Remaining: ${remaining}/${row.quantity}`);
      if (flags.length > 0) {
        console.log(`  Flags: ${flags.join(', ')}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('Failed to fetch reminders:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();

