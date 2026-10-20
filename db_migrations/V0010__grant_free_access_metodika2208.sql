UPDATE t_p75689129_landing_chatbot_desi.subscriptions SET is_active = false WHERE user_id = 10 AND is_active = true;
INSERT INTO t_p75689129_landing_chatbot_desi.subscriptions (user_id, plan, started_at, expires_at, is_active)
VALUES (10, '30days', now(), now() + interval '365 days', true);