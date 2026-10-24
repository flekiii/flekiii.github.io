# Fleki's Wrld external sign-in

Backend code is already deployed to the separate Cloudflare Worker \`flekis-wrld-api\`, with tables in \`flekis-wrld-social\`.

## Providers
- **Google (Google/Gmail account):** \`GOOGLE_CLIENT_ID\`, \`GOOGLE_CLIENT_SECRET\`.
- **GitHub:** \`GITHUB_CLIENT_ID\`, \`GITHUB_CLIENT_SECRET\`.
- **Discord:** \`DISCORD_CLIENT_ID\`, \`DISCORD_CLIENT_SECRET\`.
- **Apple:** \`APPLE_CLIENT_ID\` (Service ID), \`APPLE_TEAM_ID\`, \`APPLE_KEY_ID\`, \`APPLE_PRIVATE_KEY\` (Apple .p8 private key, stored only as a Cloudflare secret). Apple usually requires a paid Apple Developer membership; do not activate it if a zero-cost solution is mandatory.

The callbacks configured with each provider must match **exactly**:
- \`https://flekis-wrld-api.flekideveloper.workers.dev/auth/oauth/callback/google\`
- \`https://flekis-wrld-api.flekideveloper.workers.dev/auth/oauth/callback/apple\`
- \`https://flekis-wrld-api.flekideveloper.workers.dev/auth/oauth/callback/github\`
- \`https://flekis-wrld-api.flekideveloper.workers.dev/auth/oauth/callback/discord\`

Only minimal identity scopes are requested: Google \`openid profile\`, GitHub \`read:user\`, Discord \`identify\`, Apple \`openid\`. OAuth accounts are tied to the **stable provider account ID**, not linked to other accounts based on email. The backend does not store OAuth access or refresh tokens.

**Activation requires provider-side OAuth application creation and confidential secrets**. None of the providers is enabled until configured. The UI displays \`Soon\` rather than performing fake login.

Configure credentials in **Cloudflare → Workers & Pages → flekis-wrld-api → Settings → Variables and Secrets**, storing client secrets/private keys as encrypted secrets, not source code or GitHub files. Deploy after configuring.

\`GET /auth/providers\` returns the readiness state for each provider. The flow uses a random short-lived state cookie, server-side state record, optional PKCE, verified provider identity, and a one-time 90-second sign-in ticket. On callback it redirects to \`https://flekiii.github.io/#profile?oauth_ticket=…\`, which the frontend removes from the browser URL before redeeming. 2FA must **still** be enrolled and verified before any member can post, chat or add friends.

The separate Worker also needs \`MFA_MASTER_KEY\` (base64url of 32 cryptographically random bytes) as an **encrypted Worker secret** for secure TOTP enrollment. The Worker settings were observed to have only the D1 binding; do not claim 2FA is live until this secret is configured and tested. Never commit any secret to the repository.

### Verify before public release
1. Authenticate using each enabled external provider; verify that accounts retain consistent identities on subsequent logins.
2. Cancel a login and verify that no account is created.
3. Tamper with OAuth \`state\` and repeat callback/ticket to verify rejection.
4. Verify member can read but cannot send posts, direct messages or friend requests without 2FA.
5. Confirm TOTP enrollment, login challenge, recovery codes and two test user accounts.
6. Verify blocking prevents messages in both directions; confirm notifications are private and user-specific.

This directory contains no working OAuth client secrets; external sign-in activation cannot be inferred merely from code deployment.
