# Fleki Authenticator for Windows — offline desktop source

This is a local-only Electron app packaging the very same audited TOTP vault UI used by Fleki Authenticator PWA. The encrypted vault uses PBKDF2 / AES-GCM and remains in the desktop app's isolated persistent browser storage. It does not send secrets to fmail, Google, or any server.

To run: `cd authenticator/desktop-app && npm install && npm start`.
To build on Windows: `npm run build` (NSIS .exe installer and portable executable).

Source status: build configuration only; no compiled or signed Windows binary has been published or verified. Build and test on Windows before distributing. Keep encrypted backups of your codes, because removing local app storage deletes the vault. QR scanning requires supported Chromium camera APIs and explicit device permission.

For Android, the current standalone offline-capable web app is at https://fleki-authenticator.flekideveloper.workers.dev/. A signed native APK/AAB is a separate deliverable and not yet built.

Never inject login credentials or access secrets into the authenticator renderer. Its private vault must stay independent of fmail sessions.
