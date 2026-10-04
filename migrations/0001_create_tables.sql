CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY NOT NULL,
    login TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    access_expires INTEGER NOT NULL,
    refresh_token TEXT,
    refresh_expires INTEGER
);
