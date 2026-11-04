-- When DearKarl last told an unknown sender "I don't know this address".
-- Caps that mail at one per address per day, so spam sent to a DearKarl
-- address cannot burn Elastic Email sends or the sender reputation.
CREATE TABLE IF NOT EXISTS unknown_sender_notices (
    address   TEXT PRIMARY KEY NOT NULL,
    last_sent INTEGER NOT NULL
);
