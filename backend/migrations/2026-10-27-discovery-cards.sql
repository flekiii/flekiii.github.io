
-- Two independently controlled questionnaires, with private photos that can only be
-- fetched by a mutually age-compatible signed-in member of the same discovery mode.
CREATE TABLE IF NOT EXISTS wrld_discovery_cards (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 mode TEXT NOT NULL CHECK(mode IN ('friends','dating')),
 active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1)),
 bio TEXT NOT NULL DEFAULT '',
 gender TEXT NOT NULL DEFAULT 'undisclosed' CHECK(gender IN ('boy','girl','other','undisclosed')),
 seeking TEXT NOT NULL DEFAULT 'everyone' CHECK(seeking IN ('boys','girls','everyone')),
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,mode)
);
CREATE TABLE IF NOT EXISTS wrld_discovery_photos (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 mode TEXT NOT NULL CHECK(mode IN ('friends','dating')),
 mime TEXT NOT NULL,
 data BLOB NOT NULL,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,mode)
);
