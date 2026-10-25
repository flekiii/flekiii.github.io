# Auth2FA download publication

This folder owns the public Auth2FA download page at https://flekiii.github.io/auth2fa/.

## Deployment model

The source and CI for Auth2FA currently live in a separate **private** repository. Do not link site visitors to its private GitHub Actions or artifacts: they see 404.

The user-facing download interface is hosted entirely by Fleki's Wrld. The manifest `releases.json` controls which verified installation buttons are enabled.

Only publish installers in either:

- A public release of this **public** website repository: `https://github.com/flekiii/flekiii.github.io/releases/download/<tag>/<filename>`, or
- A file hosted under the site's public `/downloads/auth2fa/<filename>` path (respect GitHub Pages file-size limits).

Never link to private artifacts, private repositories, old Worker/PWA pages, untested executables, or missing file paths.

## Steps to publish a release

1. Build actual Auth2FA Windows EXE, Android **signed release** APK, and optional Linux AppImage.
2. Verify installation, launch, offline TOTP, QR scanning, encrypted backup import/export and app updates on real devices. Ensure the APK is signed with a safeguarded release key and the publisher is verified. Windows signing is strongly preferred before broad distribution.
3. Compute SHA-256 checksums and exact byte lengths for each tested binary, and retain them alongside the release.
4. Upload the verified binaries to a public release of `flekiii/flekiii.github.io` or the public download path above. Test the binary URLs in a fresh/incognito browser without GitHub login.
5. Edit `auth2fa/releases.json`: set `downloads.<platform>.status` to `available`, `verified` to `true`, `url` to the exact public file link, `file` to the filename, `size_bytes` to the exact size and `sha256` to its full 64-character hash. Update `version` and `stage` appropriately.
6. Check https://flekiii.github.io/#apps and https://flekiii.github.io/auth2fa/ in a private browser and verify the resulting real downloads. For same-origin files, the page also checks the HTTP HEAD response and content length before enabling its button.

**Fail-closed default:** `status: pending`, `verified: false`, and `url: null` keep the UI accurate while packages are missing. No placeholder download URL is ever shown to users.

## Preservation of the old authenticator

The former **Fleki Authenticator** web launcher has been removed from the Apps listing and from the main site's 2FA settings. Its separate encrypted vault and legacy Worker deployment should not be destroyed until any existing user has safely moved or exported their codes. The private application build can retain the old vault storage key for compatibility. Removing old promotional links does not delete people's security codes.

## Naming

The installed program is **Auth2FA**. Product downloads use this name consistently; do not resurrect the previous Fleki Authenticator / 2FAuth names in the site's Apps listing.
