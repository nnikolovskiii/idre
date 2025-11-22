CREATE TABLE whiteboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership and relationships (following existing patterns)
    user_id VARCHAR(255) NOT NULL,
    notebook_id UUID NOT NULL,

    -- Core whiteboard fields
    title TEXT NOT NULL DEFAULT 'Untitled Whiteboard',
    content JSONB NOT NULL DEFAULT '{}',

    -- Metadata
    thumbnail_url TEXT NULL,  -- Optional thumbnail for preview

    -- Timestamps (following existing patterns)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_whiteboards_user_id ON whiteboards(user_id);
CREATE INDEX idx_whiteboards_notebook_id ON whiteboards(notebook_id);
CREATE INDEX idx_whiteboards_created_at ON whiteboards(created_at);
CREATE INDEX idx_whiteboards_updated_at ON whiteboards(updated_at);

-- Composite index for user's whiteboards in a notebook
CREATE INDEX idx_whiteboards_user_notebook ON whiteboards(user_id, notebook_id);

-- Update updated_at trigger (following existing patterns)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whiteboards_updated_at
    BEFORE UPDATE ON whiteboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();