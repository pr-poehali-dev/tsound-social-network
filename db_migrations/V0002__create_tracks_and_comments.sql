-- Таблица треков
CREATE TABLE IF NOT EXISTS tracks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    artist VARCHAR(500) NOT NULL,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    user_session_id VARCHAR(255) NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

-- Таблица лайков
CREATE TABLE IF NOT EXISTS track_likes (
    id SERIAL PRIMARY KEY,
    track_id VARCHAR(255) NOT NULL,
    user_session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(track_id, user_session_id)
);

-- Таблица комментариев
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(255) PRIMARY KEY,
    track_id VARCHAR(255) NOT NULL,
    user_session_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Таблица плейлистов
CREATE TABLE IF NOT EXISTS playlists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    user_session_id VARCHAR(255) NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Связь треков и плейлистов
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id SERIAL PRIMARY KEY,
    playlist_id VARCHAR(255) NOT NULL,
    track_id VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT now(),
    UNIQUE(playlist_id, track_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_tracks_created ON tracks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_track_likes_track ON track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_comments_track ON comments(track_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_session_id);