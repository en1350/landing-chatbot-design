CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    author_name VARCHAR(80) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_id_desc ON t_p75689129_landing_chatbot_desi.chat_messages (id DESC);