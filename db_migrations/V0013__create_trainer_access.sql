CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.trainer_access (
    user_id INTEGER PRIMARY KEY,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO t_p75689129_landing_chatbot_desi.trainer_access (user_id) VALUES (10) ON CONFLICT (user_id) DO NOTHING;