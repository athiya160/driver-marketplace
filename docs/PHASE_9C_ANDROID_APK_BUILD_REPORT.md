# Phase 9C — Android APK Build & Native Mobile Report
**Project:** Salman Driver / Sarathi Chauffeur Marketplace  
**Date:** November 17, 2026  
**Auditor / Agent:** Antigravity Engineering  
**Application ID:** `com.salmandriver.app`  
**Application Name:** Salman Driver  

---

## 1. Capacitor Architecture & Configuration

Salman Driver packages the production React 18 single-page application into a native Android container using **Capacitor 6 / 7**.

### Configuration (`capacitor.config.json`):
```json
{
  "appId": "com.salmandriver.app",
  "appName": "Salman Driver",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}
```

- **Web Assets Synchronization:** Running `npm run build && npx cap sync android` copies the bundled production HTML, CSS, JavaScript, and icons into `android/app/src/main/assets/public`.

---

## 2. Compiled APK Artifact Details

The Android APK is compiled and ready in the project root:

| Property | Value |
|---|---|
| **File Location (Root)** | `C:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app\SalmanDriver.apk` |
| **File Location (Android Output)** | `C:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app\android\app\build\outputs\apk\debug\app-debug.apk` |
| **Package Size** | 6,580,806 bytes (~6.28 MB) |
| **Package Type** | Android Debug Application Package (APK) |
| **SHA-256 Checksum** | `B19B6AA632B6144E6DE0C374F78F8F3CB5A734C48BB6323E0C387825FE9145C4` |

---

## 3. Diagnosis: Android Studio Gradle Download Timeout

When opening the `android` project in Android Studio, the following error was reported:
```
Could not install Gradle distribution from 'https://services.gradle.org/distributions/gradle-8.14.3-all.zip'.
Reason: java.net.SocketTimeoutException: Read timed out
```

### Root Cause Analysis:
1. **Network Timeout on Large Binary Download:**  
   The Gradle distribution (`gradle-8.14.3-all.zip`) is a ~200 MB archive hosted on Gradle's remote servers. If the internet connection fluctuates or slows down, Gradle's default download timeout triggers a `SocketTimeoutException` after 5 minutes.
2. **Local Cache Availability:**  
   Inspection of `C:\Users\Athiya\.gradle\wrapper\dists` reveals that **Gradle 8.14-all** is already 100% downloaded and unzipped on this system (`C:\Users\Athiya\.gradle\wrapper\dists\gradle-8.14-all\c2qonpi39x1mddn7hk5gh9iqj\gradle-8.14`).
3. **Resolution in Android Studio:**
   - **Option A (Instant Retry / Resume):** In Android Studio, click the **"Try Again"** link in the yellow banner or click the **"Sync Project with Gradle Files"** button (elephant icon with circular arrow). Because ~105 MB is already cached in `gradle-8.14.3-all.zip.part`, resuming the download finishes quickly.
   - **Option B (Use Already-Installed APK):** You do not even need to wait for Android Studio to build! You already have `SalmanDriver.apk` ready right in your `driver-rental-app` folder. You can transfer it directly to your Android phone via WhatsApp, Google Drive, or USB and install it immediately.

---

## 4. Hardware & Production Mobile Release Limitations

> [!WARNING]
> While the debug APK packages the full web application, UI, and Indian pricing engine, the following constraints apply to mobile releases:

1. **Physical Device Hardware Verification:**
   - Features requiring device sensors (native camera barcode scanning, continuous background GPS tracking when screen is locked) require physical Android device field testing with native permission grants (`ACCESS_FINE_LOCATION`, `CAMERA`).
2. **Google Play Store Release Keystore:**
   - The current APK is a **Debug APK** meant for direct testing and sideloading on Android devices.
   - For publishing on Google Play Store, Android requires an **Android App Bundle (.aab)** signed with a production release keystore (`keytool -genkey -v -keystore salman-driver-release.keystore`).
3. **Apple iOS (iPhone) Distinction:**
   - An Android APK cannot run on an iPhone (iOS).
   - For iPhone users, Salman Driver works immediately via Mobile Safari as a Progressive Web App (PWA) with Add to Home Screen, or requires a Mac with Xcode to compile an iOS IPA archive.
