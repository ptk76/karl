-- Brings users to the current schema: adds session_id and makes
-- access_token/access_expires nullable.
--
-- These changes used to be edits to 0001, but wrangler tracks migrations by
-- file name, so a database that had already run 0001 never got them
-- ("No migrations to apply") and login failed on the missing session_id.
-- Never edit an applied migration; add a new one.
--
-- SQLite can't drop NOT NULL in place, so the table is rebuilt. The copy
-- lists only the columns every version of 0001 had, so this also runs on a
-- database created from the edited 0001 (sessions are dropped, users log in
-- again).

CREATE TABLE users_new (
    email TEXT PRIMARY KEY NOT NULL,
    login TEXT UNIQUE NOT NULL,
    access_token TEXT,
    access_expires INTEGER,
    refresh_token TEXT,
    refresh_expires INTEGER,
    session_id TEXT
);

INSERT INTO users_new (email, login, access_token, access_expires, refresh_token, refresh_expires)
SELECT email, login, access_token, access_expires, refresh_token, refresh_expires FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;
