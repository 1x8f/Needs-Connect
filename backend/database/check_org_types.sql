-- Check what org_type values are in the database
SELECT id, title, org_type, cost, quantity
FROM needs
ORDER BY id DESC
LIMIT 10;

