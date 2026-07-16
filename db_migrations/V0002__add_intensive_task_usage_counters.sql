ALTER TABLE t_p75689129_landing_chatbot_desi.usage_counts
  ADD COLUMN IF NOT EXISTS intensives_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tasks_used integer NOT NULL DEFAULT 0;