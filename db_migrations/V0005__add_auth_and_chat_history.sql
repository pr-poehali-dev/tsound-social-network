ALTER TABLE t_p95121472_tsound_social_networ.users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE TABLE IF NOT EXISTS t_p95121472_tsound_social_networ.chat_history (
    id SERIAL PRIMARY KEY,
    user1_session_id VARCHAR(255) NOT NULL,
    user2_session_id VARCHAR(255) NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_session_id, user2_session_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user1 ON t_p95121472_tsound_social_networ.chat_history(user1_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user2 ON t_p95121472_tsound_social_networ.chat_history(user2_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_last_message ON t_p95121472_tsound_social_networ.chat_history(last_message_at DESC);