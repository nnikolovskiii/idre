-- V4__create_tasks_table.sql
-- Migration: Create tasks table with kanban board functionality

BEGIN;

-- Create task_status enum type
CREATE TYPE task_status AS ENUM ('todo', 'in-progress', 'review', 'done');

-- Create task_priority enum type
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    notebook_id UUID NOT NULL,

    -- Task details
    title TEXT NOT NULL,
    description TEXT,

    -- Task status and priority
    status task_status NOT NULL DEFAULT 'todo',
    priority task_priority NOT NULL DEFAULT 'medium',

    -- Optional fields
    tags TEXT[],  -- PostgreSQL array for tag storage
    due_date DATE,

    -- Kanban board positioning
    position INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_tasks_notebook_id
        FOREIGN KEY (notebook_id)
        REFERENCES notebooks(id)
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_notebook_id ON tasks(notebook_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_notebook_status ON tasks(notebook_id, status);
CREATE INDEX idx_tasks_position ON tasks(notebook_id, status, position);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) for multi-tenant safety
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to ensure users can only access their own tasks
CREATE POLICY tasks_user_policy ON tasks
    FOR ALL
    TO authenticated
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

COMMIT;