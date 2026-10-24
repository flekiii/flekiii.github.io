# Fleki's Wrld

A community-first world for games, software, services, digital creations, and people.

**Website:** https://flekiii.github.io/

## What is prepared

- Responsive Community and Notifications tabs, matching the site's dark/light themes.
- Account registration and login UI, separate from other projects.
- Member profiles with usernames, display names and bios.
- Global community chat, friends, friend requests, private messages.
- Block/unblock users and individually pin messages.
- Notifications for friend requests, accepted invitations and direct messages.
- TOTP authenticator enrollment and login verification.
- Database row-level permissions to require **verified 2FA (JWT AAL2)** for posting messages and creating/accepting friend requests, pinning messages and editing profiles.

This is **not a live social network yet**. The site deliberately displays a Coming soon / setup state until an independent backend is configured. No fake members, posts or notifications are displayed.

## Launching the social backend

Use a **new, dedicated Supabase project** for Fleki's Wrld. **Do not use XONI Mail or AURVEX ID**, and do not put passwords or service-role keys in browser code.

1. Create a separate Supabase project under a free-compatible plan and verify the cost before approving any paid resource.
2. In the Supabase SQL editor of that project, review and run `supabase/wrld-social.sql`. It contains the tables, indexes, private functions, triggers, row-level policies, TOTP requirement and a basic posting cooldown.
3. In Supabase Auth configure email signups, email confirmation and the redirect URL `https://flekiii.github.io/`. Enable TOTP verification for users. Configure SMTP/rate limits as needed before inviting users.
4. Fill in **only public** `url` and `publishableKey` in `wrld-config.js`. Never commit service-role or secret keys. The site loads the connected backend automatically.
5. Test with **two fresh accounts** and two authenticator apps. Verify that one-factor sessions can read but cannot post, message, pin, edit a profile or send/accept friend requests. Verify that `aal2` can.
6. Verify both block directions, no DMs without an accepted friendship, ownership checks for profile and notifications, and the public-chat rate limit.
7. Run Supabase security/performance advisors before opening signups. Add moderation/reporting processes, backups and stronger spam protections before a wider public launch.

### Files in use

- `index.html`: main world navigation and layout.
- `wrld-social.js`: social client UI and actions.
- `wrld-social.css`: community styles.
- `wrld-config.js`: public configuration, intentionally empty.
- `supabase/wrld-social.sql`: dedicated social database schema, not yet applied.

### Privacy and limits

Registration uses email + password (no mandatory real name or phone). Username, display name and bio are visible to signed-in members. The server stores chat content; **private messages are not end-to-end encrypted**. Supabase TOTP does not guarantee recovery codes: users should add a backup factor. Message pinning is personal, not global moderation.

The frontend depends on Supabase Auth and PostgreSQL RLS. Merely hiding a button does not confer security; database permissions are the real enforcement layer.
