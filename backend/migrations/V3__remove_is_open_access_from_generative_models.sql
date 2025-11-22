-- Remove is_open_access column from generative_models table
-- All models now require API keys to access

ALTER TABLE generative_models DROP COLUMN IF EXISTS is_open_access;