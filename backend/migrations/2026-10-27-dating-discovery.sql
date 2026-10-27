-- Separate, explicit opt-in for age-segregated dating discovery. Nobody is included by default.
CREATE TABLE IF NOT EXISTS wrld_discovery_dating (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS wrld_discovery_dating_visible ON wrld_discovery_dating(enabled) WHERE enabled=1;
