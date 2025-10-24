CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_users_session_id ON users(session_id);