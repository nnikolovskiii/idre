-- Add task-notebook relationship
-- This migration adds the foreign key constraint between tasks and notebooks tables
-- and documents the SQLAlchemy relationship between Task and Notebook models.

-- Add foreign key constraint to link tasks.notebook_id to notebooks.id
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_notebook_id
FOREIGN KEY (notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE;

-- The relationship is defined in backend/models/task.py:
-- notebook = relationship("Notebook", backref="tasks")

-- This allows for easier ORM queries and navigation between related objects.