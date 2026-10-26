ALTER TABLE t_p75689129_landing_chatbot_desi.experience_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.experience_likes (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.experience_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    author_name VARCHAR(80) NOT NULL,
    text TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_experience_comments_post ON t_p75689129_landing_chatbot_desi.experience_comments (post_id, id);