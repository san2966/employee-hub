-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert portal users with bcrypt-hashed passwords
-- Using crypt() with bf (blowfish/bcrypt) algorithm
INSERT INTO portal_users (username, password_hash, role, is_active) VALUES
  ('director', crypt('Director@100', gen_salt('bf')), 'director', true),
  ('hr', crypt('Hr@12345', gen_salt('bf')), 'hr', true),
  ('accounts', crypt('Account@1', gen_salt('bf')), 'accounts', true),
  ('admin', crypt('Admin@123', gen_salt('bf')), 'admin', true),
  ('ithead', crypt('ITHead@123', gen_salt('bf')), 'ithead', true),
  ('employee', crypt('Employee@1', gen_salt('bf')), 'employee', true)
ON CONFLICT (username) DO NOTHING;