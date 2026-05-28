## Deep links / Universal links setup

This repo includes templates for:

- Android App Links: `web-dashboard/public/.well-known/assetlinks.json`
- iOS Universal Links: `web-dashboard/public/.well-known/apple-app-site-association`

These **must be filled in** for production deep links (e.g. `/auth/magic`) to open the mobile app instead of the browser.

---

## Android (App Links)

### What value goes into `assetlinks.json`?

`sha256_cert_fingerprints` must contain the **SHA-256 of the certificate that signs the APK/AAB installed on devices**.

- If you enable **Google Play App Signing** (recommended), use the **App signing key certificate SHA-256** from:
  - Play Console → **App Integrity** → **App signing**.
- If you are **not** using Play App Signing (or you are testing via a locally signed release build), use the SHA-256 of **your release keystore** certificate.

### Get SHA-256 from a keystore (local signing)

You need:
- The keystore file path (from `flutter-app/android/key.properties` → `storeFile=...`)
- The key alias (`keyAlias=...`)

PowerShell example:

```powershell
keytool -list -v `
  -keystore "PATH_TO_YOUR_KEYSTORE.jks" `
  -alias "YOUR_KEY_ALIAS"
```

Copy the **SHA256** line and replace the placeholder in:

- `web-dashboard/public/.well-known/assetlinks.json`

---

## iOS (Universal Links)

`apple-app-site-association` must contain:

- `appID`: `TEAM_ID.BUNDLE_ID`

For this project the bundle id is expected to be:

- `com.djiguicorporation.sahel_agriconnect`

So the final value should look like:

- `ABCDE12345.com.djiguicorporation.sahel_agriconnect`

Replace the placeholder in:

- `web-dashboard/public/.well-known/apple-app-site-association`

---

## Verification checklist

- `https://sahelagriconnect.com/.well-known/assetlinks.json` returns **200** and valid JSON.
- `https://sahelagriconnect.com/.well-known/apple-app-site-association` returns **200** with **no** `.json` extension.
- Android: `adb shell pm get-app-links com.djiguicorporation.sahel_agriconnect` shows the domain verified.
- iOS: `swcutil dl -d sahelagriconnect.com` (macOS) shows the domain associated.

