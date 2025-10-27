-- Add org_type column to needs table for custom feature
-- This allows us to identify which organization type a need belongs to
-- and activate custom features accordingly (e.g., Adoption Impact Tracker for animal shelters)

ALTER TABLE needs ADD COLUMN org_type VARCHAR(50) DEFAULT 'other' AFTER category;

-- Verify the column was added
DESCRIBE needs;

