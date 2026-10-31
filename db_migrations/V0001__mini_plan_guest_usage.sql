CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.mini_plan_guest_usage (
    ip_hash TEXT NOT NULL,
    day DATE NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (ip_hash, day)
);