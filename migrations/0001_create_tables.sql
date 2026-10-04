CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY NOT NULL,
    login TEXT UNIQUE NOT NULL,
    access_token TEXT,
    access_expires INTEGER,
    refresh_token TEXT,
    refresh_expires INTEGER,
    session_id TEXT
);
