CREATE TABLE IF NOT EXISTS api_tokens (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    name         TEXT NOT NULL DEFAULT 'Default',
    token_hash   TEXT NOT NULL UNIQUE,
    token_prefix TEXT NOT NULL,
    created_at   INTEGER NOT NULL,
    expires_at   INTEGER,
    last_used_at INTEGER,
    revoked_at   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_email_revoked ON api_tokens(email, revoked_at);
