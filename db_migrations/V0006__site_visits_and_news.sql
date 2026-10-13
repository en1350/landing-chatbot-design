CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.site_visits (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_site_visits_created ON t_p75689129_landing_chatbot_desi.site_visits (created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor ON t_p75689129_landing_chatbot_desi.site_visits (visitor_id);

CREATE TABLE IF NOT EXISTS t_p75689129_landing_chatbot_desi.news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
