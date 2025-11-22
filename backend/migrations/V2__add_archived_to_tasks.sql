ALTER TABLE tasks ADD COLUMN archived BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX idx_tasks_archived ON tasks(archived);
CREATE INDEX idx_tasks_notebook_archived ON tasks(notebook_id, archived);