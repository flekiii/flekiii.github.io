# Fleki Authenticator Android — native APK source setup

This is an Android Capacitor 8 application configuration for the offline Fleki Authenticator assets in `../desktop-app/assets`. Its WebView loads local packaged HTML/JS/CSS. The TOTP vault works locally using Web Crypto and no Internet connection is needed.

Requirements: Node.js 22+, Android Studio, Android SDK and a JDK supported by Capacitor 8.

1. Open terminal in `authenticator/android-app`.
2. Run `npm install`.
3. Run `npm run android:init` to generate the platform project.
4. Run `npm run android:sync`.
5. Run `npm run android:open` and build/debug/test in Android Studio.
6. To distribute, generate and sign a **release** AAB/APK using Android Studio, verify backup import/export and 6-digit TOTP test vectors on a physical phone.

No APK is yet compiled or digitally signed. The Android native platform output is created by Capacitor at build time, rather than committed manually. QR camera support must be tested on the device; manual Base32 enrollment works without it. Offline vault data is device-local and may be lost after uninstall: keep an encrypted backup and its passphrase separately.

The app is independent of fmail sessions and also supports standards-compliant TOTP secrets from compatible apps. Do not store TOTP master secrets in fmail accounts.
