ALTER TABLE t_p75689129_landing_chatbot_desi.users ADD COLUMN IF NOT EXISTS mailing_optout BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE t_p75689129_landing_chatbot_desi.users ADD COLUMN IF NOT EXISTS unsub_token TEXT;
UPDATE t_p75689129_landing_chatbot_desi.users SET unsub_token = md5(random()::text || id::text || clock_timestamp()::text) WHERE unsub_token IS NULL;
ALTER TABLE t_p75689129_landing_chatbot_desi.users ALTER COLUMN unsub_token SET DEFAULT md5(random()::text || clock_timestamp()::text);