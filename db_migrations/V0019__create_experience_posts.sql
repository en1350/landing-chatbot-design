CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.experience_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    author_name VARCHAR(80) NOT NULL,
    kind VARCHAR(20) NOT NULL DEFAULT 'work',
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    file_url TEXT,
    file_name VARCHAR(200),
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_experience_posts_id_desc ON t_p75689129_landing_chatbot_desi.experience_posts (id DESC);