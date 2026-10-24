# Fleki's Wrld

Live website: https://flekiii.github.io/

## Community backend

Fleki's Wrld has its own independent Cloudflare stack:
- **Worker API**: https://flekis-wrld-api.flekideveloper.workers.dev
- **D1 database**: `flekis-wrld-social`, EU residency.
- **Frontend**: `wrld-social.js`, `wrld-social.css`, integrated into `index.html`.
- **Worker implementation**: `backend/worker.js`.
- **Schema**: `backend/d1-schema.sql`.

The social features do **not** share an authentication database with XONI Mail, AURVEX or other projects.

### Features

- Account registration without mandatory email/phone/real name.
- Salted PBKDF2-SHA256 password hashes; random session tokens hashed in D1.
- Authenticator TOTP and eight one-use recovery codes, hashed in the database.
- Mandatory server-verified 2FA to send messages, add/accept friends, pin messages, and edit profiles.
- Global group chat, accepted-friend direct messages, friend requests, member search.
- Private message/participant visibility checks, blocking both ways, own-message deletion, message reports.
- Personal message/contact pins.
- Notifications for friendship and direct messages, with mark-read and regular polling.
- Dark/light themes and bottom dock navigation inherited from the site.

### Important security and operational notes

- Session bearer tokens live in browser `sessionStorage`, not cookies. Closing the tab may sign users out.
- TOTP secrets are accessible only through backend/database privileges and are stored in D1 (Cloudflare-managed encryption at rest); **application-layer encryption for TOTP seeds was not enabled** because the connected tool couldn't provision a Worker secret. Hardening this is a priority.
- **Direct messages are not end-to-end encrypted.**
- No email is collected; account password reset is not available. Save credentials and recovery codes securely.
- Rate limits are present but modest. Abuse moderation, deletion request tools, backups, and load tests should be improved before a large public launch.
- GitHub Pages and Workers deployments should be smoke-tested using two real test accounts after DNS propagation.
- D1 and Workers free quotas apply. See https://developers.cloudflare.com/workers/platform/pricing/.

### Deployment

The GitHub repo contains the Worker code and the D1 schema; the active Cloudflare Worker and D1 resources were created through the connected Cloudflare account. Updating `backend/worker.js` on GitHub **does not auto-deploy** the Worker unless CI is later added.

Do not add secrets to this repository. Keep Workers and D1 free quotas monitored.

