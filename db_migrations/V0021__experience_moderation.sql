ALTER TABLE t_p75689129_landing_chatbot_desi.experience_posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';
UPDATE t_p75689129_landing_chatbot_desi.experience_posts SET status = 'approved' WHERE status = 'pending';
ALTER TABLE t_p75689129_landing_chatbot_desi.experience_posts ADD COLUMN IF NOT EXISTS reject_reason TEXT;