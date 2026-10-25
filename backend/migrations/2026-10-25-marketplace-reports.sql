-- Marketplace moderation reports, independently restricted by the server's authenticated API.
CREATE TABLE IF NOT EXISTS market_reports (
 id TEXT PRIMARY KEY,
 reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 listing_id TEXT NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 10 AND 500),
 created_at INTEGER NOT NULL,
 UNIQUE(reporter_id,listing_id)
);
CREATE INDEX IF NOT EXISTS market_reports_queue ON market_reports(created_at DESC);
