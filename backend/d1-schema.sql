-- Fleki's Wrld independent Cloudflare D1 database.
-- Deploy ONLY to dedicated flekis-wrld-social; do not mix with XONI or AURVEX.

CREATE TABLE _cf_KV (
        key TEXT PRIMARY KEY,
        value BLOB
      ) WITHOUT ROWID;

CREATE TABLE blocks(
 blocker TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 blocked TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL, PRIMARY KEY(blocker,blocked),CHECK(blocker<>blocked)
);

CREATE TABLE contact_pins(
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 contact_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL,PRIMARY KEY(user_id,contact_id),CHECK(user_id<>contact_id)
);

CREATE TABLE friendships(
 id TEXT PRIMARY KEY, user_low TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 user_high TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 requester TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL CHECK(status IN ('pending','accepted')),
 created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,UNIQUE(user_low,user_high)
);

CREATE TABLE login_attempts(
 key_hash TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL
);

CREATE TABLE messages(
 id TEXT PRIMARY KEY, author TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient TEXT REFERENCES users(id) ON DELETE CASCADE,
 content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 2000),
 created_at INTEGER NOT NULL,CHECK(recipient IS NULL OR recipient<>author)
);

CREATE TABLE notifications(
 id TEXT PRIMARY KEY, recipient TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 actor TEXT REFERENCES users(id) ON DELETE SET NULL,
 kind TEXT NOT NULL CHECK(kind IN ('friend_request','friend_accepted','direct_message')),
 ref_id TEXT, read_at INTEGER, created_at INTEGER NOT NULL
);

CREATE TABLE pins(
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL, PRIMARY KEY(user_id,message_id)
);

CREATE TABLE recovery_codes(
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 code_hash TEXT NOT NULL, PRIMARY KEY(user_id,code_hash)
);

CREATE TABLE reports(
 id TEXT PRIMARY KEY, reporter TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 3 AND 300),
 created_at INTEGER NOT NULL,UNIQUE(reporter,message_id)
);

CREATE TABLE sessions(
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 mfa_verified INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);

CREATE TABLE users(
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 display_name TEXT NOT NULL, bio TEXT NOT NULL DEFAULT '',
 salt TEXT NOT NULL, password_hash TEXT NOT NULL,
 mfa_secret TEXT, mfa_pending TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);

CREATE INDEX idx_blocks_reverse ON blocks(blocked,blocker);

CREATE INDEX idx_dm_author ON messages(author,created_at DESC);

CREATE INDEX idx_dm_recipient ON messages(recipient,created_at DESC);

CREATE INDEX idx_friends_high ON friendships(user_high,status);

CREATE INDEX idx_friends_low ON friendships(user_low,status);

CREATE INDEX idx_global ON messages(created_at DESC) WHERE recipient IS NULL;

CREATE INDEX idx_notifications ON notifications(recipient,created_at DESC);

CREATE INDEX idx_sessions_user ON sessions(user_id,expires_at);
