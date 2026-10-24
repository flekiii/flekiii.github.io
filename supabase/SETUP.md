# Fleki's Wrld — social system setup

The GitHub Pages app has prepared **Community**, **Notifications**, registration, member profiles, public chat, friends, direct messages, blocking, personal message pins and authenticator-app TOTP 2FA.

**Status:** The social frontend and database migration are committed, but there is no dedicated Fleki's Wrld backend connected yet. The public site displays an explicit setup notice rather than pretending that user accounts or chats already work.

## Activate on a dedicated backend

1. Create a **separate** Supabase project named for Fleki's Wrld. Do **not** use existing XONI Mail or AURVEX ID databases.
2. In that project's SQL Editor, apply `supabase/wrld-social.sql` **once**. It creates only tables prefixed `wrld_` and a non-exposed private schema.
3. Turn on Email auth and confirm-email settings as desired. Set Site URL to `https://flekiii.github.io/` and configure allowed redirect URLs. Do not enable anonymous sign-ins.
4. Verify TOTP enrollment/challenge is enabled under MFA settings. TOTP is free on Supabase. Set sensible abuse-prevention, email rate limits and CAPTCHA before public launch.
5. Copy the project's API URL and its **public** publishable key into `wrld-config.js`. Never use a service-role key, secret API key, database password or other server credentials in client-side files.
6. Let GitHub Pages deploy; create two new test accounts (use test email addresses you control), confirm emails, enroll TOTP on both, and verify read-only until AAL2.

## Security rules

- Public chat & direct messages: INSERT allowed only to authenticated sessions with verified TOTP at `aal2`; DMs additionally require accepted friendship and no mutual block.
- Friend requests & accepting them: `aal2` required, sender/recipient immutable, one row per pair.
- Pins: private to account and pin creation requires `aal2`.
- Blocks: user can block/unblock even at `aal1`, to avoid locking basic safety behind MFA.
- Notifications are inserted by database triggers on friend request, accepted request, and private message; clients only read and mark their own notifications.
- Profiles display nicknames/bio but **never publish email addresses**.
- Database tables use RLS; JWT AAL is verified on the server, not trusted from UI.
- Users should register multiple 2FA factors for recovery: Supabase TOTP does not provide downloadable recovery codes.

## Before an open public launch

Carry out real device tests, abuse/rate limiting and content moderation work, email deliverability, accessible profile and message reporting, account deletion, pagination, privacy policy, threat modeling, security audits. The current global room is **not end-to-end encrypted** and should not be described as private or anonymous. Do not claim this is production-ready just because the frontend is connected.

The front-end imports a pinned version of `@supabase/supabase-js` from an ES module CDN after configuration is supplied. For a production release, bundle an audited, pinned dependency and review CSP rules.

## Technical components

- `wrld-social.css` — responsive community/account/notification UI.
- `wrld-social.js` — social interaction and Supabase Auth/TOTP + Realtime client.
- `wrld-config.js` — safe public configuration placeholder.
- `supabase/wrld-social.sql` — schema, Row-Level Security, auto-profile trigger, notifications and realtime publication.

All other site sections remain independent and do not require backend credentials.
