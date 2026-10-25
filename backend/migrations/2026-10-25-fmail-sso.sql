-- Fleki's Wrld: additive migration for sign-in with fmail.
-- Applied to live D1 on 2026-10-25; retain for future environments.
-- Run each statement once; never drop or reset existing accounts.
ALTER TABLE sessions ADD COLUMN external_mfa INTEGER NOT NULL DEFAULT 0;
ALTER TABLE oauth_tickets ADD COLUMN external_mfa INTEGER NOT NULL DEFAULT 0;
