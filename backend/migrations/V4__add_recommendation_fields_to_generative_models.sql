    -- Add recommendation fields to generative_models table
    ALTER TABLE generative_models
    ADD COLUMN is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN recommendation_order INTEGER,
    ADD COLUMN recommendation_reason TEXT;

    -- Create index for better performance on recommended models queries
    CREATE INDEX idx_generative_models_recommended ON generative_models(is_recommended, recommendation_order);