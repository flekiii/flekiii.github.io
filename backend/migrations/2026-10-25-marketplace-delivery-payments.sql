-- Upgrade live marketplace listings without disturbing old offers or buyer/seller messages.
-- Old listings display "Other" and have no declared shipping/payment terms until edited.
ALTER TABLE market_listings ADD COLUMN subcategory TEXT NOT NULL DEFAULT 'other';
ALTER TABLE market_listings ADD COLUMN custom_type TEXT NOT NULL DEFAULT '';
ALTER TABLE market_listings ADD COLUMN delivery_providers TEXT NOT NULL DEFAULT '[]';
ALTER TABLE market_listings ADD COLUMN payment_methods TEXT NOT NULL DEFAULT '[]';
ALTER TABLE market_listings ADD COLUMN negotiable INTEGER NOT NULL DEFAULT 0 CHECK(negotiable IN (0,1));
CREATE INDEX IF NOT EXISTS market_listings_subcategory ON market_listings(category,subcategory,status,created_at DESC);
