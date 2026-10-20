CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.single_credits (
    user_id INTEGER PRIMARY KEY,
    credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.processed_payments (
    payment_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);