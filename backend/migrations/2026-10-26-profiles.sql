-- Fleki's Wrld Profile Studio additive migration. Apply to flekis-wrld-social D1 ONLY.
CREATE TABLE IF NOT EXISTS wrld_profile_settings (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 pronouns TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'online' CHECK(status IN ('online','away','dnd','offline')),
 country TEXT NOT NULL DEFAULT '',
 region TEXT NOT NULL DEFAULT '',
 district TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 website TEXT NOT NULL DEFAULT '',
 socials TEXT NOT NULL DEFAULT '{}',
 favorite_games TEXT NOT NULL DEFAULT '[]',
 current_games TEXT NOT NULL DEFAULT '[]',
 visibility TEXT NOT NULL DEFAULT '{}',
 last_seen INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS wrld_profile_media (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('avatar','banner')),
 mime TEXT NOT NULL,
 data BLOB NOT NULL,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,kind)
);
CREATE TABLE IF NOT EXISTS wrld_profile_roles (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL,
 granted_by TEXT NOT NULL REFERENCES users(id),
 granted_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(user_id,role)
);
CREATE TABLE IF NOT EXISTS wrld_profile_bans (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 banned_by TEXT NOT NULL REFERENCES users(id),
 reason TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_wrld_roles_expiry ON wrld_profile_roles(expires_at);
CREATE INDEX IF NOT EXISTS idx_wrld_ban_expiry ON wrld_profile_bans(expires_at);
-- Owner privilege is NOT awarded automatically. Configure Worker OWNER_USER_ID
-- to the verified owner's immutable users.id. Never grant owner by client input.

-- A maximum profile media file is 3 MiB. D1's maximum BLOB row is only 2,000,000 bytes.
CREATE TABLE IF NOT EXISTS wrld_profile_media_chunks (
 user_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('avatar','banner')),
 part INTEGER NOT NULL CHECK(part BETWEEN 0 AND 7),
 data BLOB NOT NULL,
 PRIMARY KEY(user_id,kind,part),
 FOREIGN KEY(user_id,kind) REFERENCES wrld_profile_media(user_id,kind) ON DELETE CASCADE
);
