-- Add color fields to notebooks table for visual organization
-- This migration adds background and text color fields to support notebook theming
-- with automatic light/dark mode adaptation through the frontend

-- Add background color field with default blue color
ALTER TABLE notebooks
ADD COLUMN bg_color VARCHAR(20) DEFAULT '#4d4dff' NOT NULL;

-- Add text color field with default white text for contrast
ALTER TABLE notebooks
ADD COLUMN text_color VARCHAR(20) DEFAULT '#ffffff' NOT NULL;

-- Add index on bg_color for potential color-based queries and performance
CREATE INDEX idx_notebooks_bg_color ON notebooks(bg_color);

-- Migration completed successfully
-- Existing notebooks will automatically get the default blue background with white text
-- New notebooks can be created with custom colors or will use the defaults