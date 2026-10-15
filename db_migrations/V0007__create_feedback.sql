CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.feedback (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    kind VARCHAR(20) NOT NULL DEFAULT 'review',
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    visitor_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    moderated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_feedback_status_created ON t_p75689129_landing_chatbot_desi.feedback (status, created_at DESC);