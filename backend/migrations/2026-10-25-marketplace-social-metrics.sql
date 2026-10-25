-- Social marketplace metrics: every favorite represents one unique saved listing.
CREATE TABLE IF NOT EXISTS market_favorites(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,listing_id)
);
CREATE INDEX IF NOT EXISTS market_favorites_listing ON market_favorites(listing_id);
CREATE TABLE IF NOT EXISTS market_reactions(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
  reaction INTEGER NOT NULL CHECK(reaction IN (-1,1)),
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id,listing_id)
);
CREATE INDEX IF NOT EXISTS market_reactions_listing ON market_reactions(listing_id,reaction);
