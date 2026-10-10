ALTER TABLE t_p75689129_landing_chatbot_desi.users
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

UPDATE t_p75689129_landing_chatbot_desi.users SET email_verified = true;

CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.email_verifications (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES t_p75689129_landing_chatbot_desi.users(id),
  token text NOT NULL UNIQUE,
  created_at timestamp with time zone NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used boolean NULL DEFAULT false
);