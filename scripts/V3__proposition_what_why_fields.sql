-- This script alters the 'propositions' table to replace the 4 fields (service, audience, problem, solution)
-- with 2 new fields (what, why). We're starting fresh as requested by dropping old data.

-- Start a transaction
BEGIN;

-- Drop the old columns
ALTER TABLE propositions
    DROP COLUMN IF EXISTS service;

ALTER TABLE propositions
    DROP COLUMN IF EXISTS audience;

ALTER TABLE propositions
    DROP COLUMN IF EXISTS problem;

ALTER TABLE propositions
    DROP COLUMN IF EXISTS solution;

-- Add the new columns
ALTER TABLE propositions
    ADD COLUMN what TEXT;

ALTER TABLE propositions
    ADD COLUMN why TEXT;

-- Commit the transaction
COMMIT;