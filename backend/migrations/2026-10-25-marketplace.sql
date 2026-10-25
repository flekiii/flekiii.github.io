-- Fleki's Wrld marketplace: first-party listings and private buyer/seller conversations.
-- These tables live in the dedicated Fleki's Wrld D1 database, not fmail or AURVEX.
CREATE TABLE IF NOT EXISTS market_listings (
 id TEXT PRIMARY KEY,
 seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 5 AND 120),
 description TEXT NOT NULL CHECK(length(description) BETWEEN 10 AND 1000),
 category TEXT NOT NULL CHECK(category IN ('furniture','food','games','game_accounts','game_currency','electronics','clothing','digital','services','other')),
 price_minor INTEGER NOT NULL CHECK(price_minor BETWEEN 0 AND 1000000000),
 currency TEXT NOT NULL CHECK(length(currency)=3),
 origin_country TEXT NOT NULL CHECK(length(origin_country)=2),
 origin_region TEXT NOT NULL CHECK(length(origin_region) BETWEEN 2 AND 100),
 shipping_countries TEXT NOT NULL CHECK(length(shipping_countries) BETWEEN 4 AND 1000),
 images TEXT NOT NULL DEFAULT '[]',
 videos TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','sold','hidden')),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS market_listings_search ON market_listings(status,created_at DESC);
CREATE INDEX IF NOT EXISTS market_listings_category ON market_listings(category,origin_country,created_at DESC);
CREATE INDEX IF NOT EXISTS market_listings_seller ON market_listings(seller_id,created_at DESC);
CREATE TABLE IF NOT EXISTS market_messages (
 id TEXT PRIMARY KEY,
 listing_id TEXT NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
 buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 1500),
 created_at INTEGER NOT NULL,
 CHECK (buyer_id <> seller_id),
 CHECK (sender_id = buyer_id OR sender_id = seller_id)
);
CREATE INDEX IF NOT EXISTS market_messages_thread ON market_messages(listing_id,buyer_id,created_at);
CREATE INDEX IF NOT EXISTS market_messages_seller ON market_messages(seller_id,created_at);
