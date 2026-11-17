# Phase 9E — Fresh Android APK Build & Artifact Verification Report

**Project:** Salman Driver / Sarathi Chauffeur Marketplace  
**Milestone:** Phase 9E — Fresh Android APK Build & Artifact Verification  
**Date:** November 17, 2026  
**Auditor / Agent:** Antigravity Engineering  
**Application ID:** `in.sarathidriver.app`  
**Application Name:** Salman Driver  
**Version:** `1.0` (versionCode: `1`)  

---

## 1. Executive Summary

In Milestone **Phase 9E**, a clean, freshly compiled Android debug APK was assembled from source code to incorporate all **Phase 9D KYC & Document Workflow updates** (removal of the Police Clearance Certificate / PCC requirement, elimination of generic file-upload placeholders, and streamlined onboarding for Commercial DL, Aadhaar Card, and Chauffeur Profile Photos).

All pre-build verification gates passed with zero regressions:
1. **Automated Test Suite:** 17 test suites, **261/261 tests passed** (including 23/23 tests in `phase_9d_kyc_regression.test.js`).
2. **Production Bundle:** Vite compiled production web assets in 26.09s (`dist/index.html` and `dist/assets/index-CHOjhlhB.js`).
3. **Capacitor Sync:** Android platform assets and native bridges synchronized successfully.
4. **Gradle Compilation:** `.\gradlew.bat assembleDebug` built successfully in 47 seconds.
5. **Artifact Deployment:** The freshly built artifact was verified and copied to the project root as `SalmanDriver.apk`.

---

## 2. Pre-Build Verification & Integrity Audit

Before initiating the native Android build, the complete pre-build validation sequence was executed:

| Stage | Command | Result | Details |
|---|---|---|---|
| **Git & Working Tree** | `git status` | Clean status confirmed | All Phase 9D KYC changes verified across `DriverDashboardScreen.jsx`, `PhotoUploadModal.jsx`, `AdminDashboardScreen.jsx`, `CustomerHomeScreen.jsx`, and `apiRouter.js`. |
| **Automated Test Suite** | `node tests/run_all_tests.js` | **17/17 Suites Passed (261/261 Tests)** | Full regression suite verified, including KYC document validation, rate limiting, booking conflict checks, and private storage authorization. |
| **Frontend Production Build** | `npm.cmd run build` | **BUILD SUCCESS** (26.09s) | Generated optimized single-page bundle: `dist/index.html` (4.11 kB) and `dist/assets/index-CHOjhlhB.js` (1,053.55 kB). |
| **Capacitor Android Sync** | `npx.cmd cap sync android` | **SYNC SUCCESS** (0.299s) | Synced web assets and Capacitor plugins into `android/app/src/main/assets/public`. |

---

## 3. Native Android Build Execution

The Android build was executed using the local Gradle wrapper:

- **Command:** `.\gradlew.bat assembleDebug`
- **Working Directory:** `C:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app\android`
- **Build Duration:** 47 seconds
- **Gradle Tasks:** 93 actionable tasks (27 executed, 66 up-to-date)
- **Exit Code:** `0` (SUCCESS)

### Key Gradle Output Milestones:
- `:capacitor-cordova-android-plugins:compileDebugJavaWithJavac`
- `:app:mergeDebugAssets`
- `:app:compressDebugAssets`
- `:app:dexBuilderDebug`
- `:app:mergeProjectDexDebug`
- `:app:packageDebug`
- `:app:assembleDebug`

---

## 4. Compiled APK Artifact Details

The fresh APK artifact exists both in Gradle's build output directory and at the project root for sideloading:

| Property | Gradle Output Artifact | Project Root Release Artifact |
|---|---|---|
| **File Location** | `android/app/build/outputs/apk/debug/app-debug.apk` | `SalmanDriver.apk` |
| **Absolute Path** | `C:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app\android\app\build\outputs\apk\debug\app-debug.apk` | `C:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app\SalmanDriver.apk` |
| **Package Size** | `6,805,363 bytes` (~6.49 MB) | `6,805,363 bytes` (~6.49 MB) |
| **Build Timestamp** | November 17, 2026, 16:04:46 IST | November 17, 2026, 16:04:46 IST |
| **Application ID** | `in.sarathidriver.app` | `in.sarathidriver.app` |
| **Version Name** | `1.0` | `1.0` |
| **Version Code** | `1` | `1` |
| **Target SDK / Min SDK**| Android 34 (Upside Down Cake) / Android 22 (Lollipop) | Android 34 / Android 22 |
| **Package Type** | Android Debug APK | Android Debug APK |
| **SHA-256 Checksum** | `A99DDD0D3B1CE966617228476903C81E977300D3D28706952EA4DF8F065C8DE9` | `A99DDD0D3B1CE966617228476903C81E977300D3D28706952EA4DF8F065C8DE9` |

---

## 5. Artifact Comparative Analysis (Phase 9C vs Phase 9E)

A side-by-side comparison confirms that the new build artifact is distinct and incorporates the latest codebase modifications:

| Metric | Previous Build (Phase 9C) | Fresh Build (Phase 9E) | Delta / Change |
|---|---|---|---|
| **Build Date** | 09-11-2026 02:12:42 IST | 17-11-2026 16:04:46 IST | Freshly built (+8 days) |
| **File Size** | 6,580,806 bytes (~6.28 MB) | 6,805,363 bytes (~6.49 MB) | +224,557 bytes (new assets & tests) |
| **SHA-256 Hash** | `B19B6AA632B6144E6DE0C374F78F8F3CB5A734C48BB6323E0C387825FE9145C4` | `A99DDD0D3B1CE966617228476903C81E977300D3D28706952EA4DF8F065C8DE9` | Distinct hash (confirmed new binary) |
| **Included Web Bundle** | `index-legacy.js` | `index-CHOjhlhB.js` | Updated bundle with Phase 9D KYC cleanup |
| **PCC Requirement** | Included | **Completely Removed** | No PCC upload blocks or validation errors |
| **Generic File Upload**| Placeholder present | **Removed** | Cleaned document-specific upload buttons only |

---

## 6. Sideloading & Installation Instructions for Motorola Moto G35 5G

Follow these step-by-step instructions to transfer and test `SalmanDriver.apk` on your **Motorola Moto G35 5G (Android 14 / Hello UI)**:

### Method A: Transfer via USB Cable (Recommended & Fastest)
1. Connect your Motorola Moto G35 5G to your PC via a USB-C data cable.
2. On your phone, swipe down from the notification bar, tap **Charging this device via USB**, and change it to **File Transfer / Android Auto**.
3. On your PC, open File Explorer and navigate to:
   `C:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app`
4. Copy `SalmanDriver.apk`.
5. Paste it into your phone's **Download** folder (`This PC\moto g35 5g\Internal shared storage\Download`).

### Method B: Transfer via Google Drive / WhatsApp
1. Open Google Drive in your PC browser and upload `SalmanDriver.apk`.
2. On your Motorola Moto G35 5G, open Google Drive, download `SalmanDriver.apk` to your device storage.
   *(Alternatively: send the APK to yourself on WhatsApp as a "Document" and download it).*

### Installing the APK on Android 14 (Hello UI):
1. On your Motorola Moto G35 5G, open the **Files by Google** app (or any file manager).
2. Go to **Downloads** (or **APKs** tab) and tap **`SalmanDriver.apk`**.
3. If prompted with *"For your security, your phone is currently not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Toggle **Allow from this source** to **ON**.
   - Press the Back button.
4. Tap **Install**.
5. Once installation finishes, tap **Open**.

---

## 7. Physical Device Verification Checklist (Phase 9F Preview)

When testing on your Motorola Moto G35 5G, verify the following core flows:

- [ ] **First Launch & Splash Screen:** App opens cleanly without white-screen or immediate crash.
- [ ] **Permissions Request:** Native prompts for Location (`ACCESS_FINE_LOCATION`) and Camera appear when triggered.
- [ ] **Chauffeur Onboarding (No PCC):**
  - Navigate to Chauffeur Registration / KYC.
  - Confirm that **Police Clearance Certificate (PCC)** is completely absent.
  - Confirm generic "Upload File" placeholder is absent.
  - Verify documents listed are: **Commercial DL (Front & Back)**, **Chauffeur Profile Photo**, and **Aadhaar Card**.
- [ ] **Camera & File Selection:** Tap to upload Profile Photo or DL; verify native camera and gallery pickers open and function.
- [ ] **Customer Experience:** Search for drivers, browse categories (Hourly, Airport, Outstation), and verify Indian Rupee fare calculation.
- [ ] **GPS & Map:** Verify current location pin appears on the booking screen.

---

## 8. Release & Deployment Constraints

> [!IMPORTANT]
> - **Do not share this APK with Salman yet.** It is an internal debug build intended exclusively for developer physical verification on your Moto G35 5G.
> - **Do not deploy publicly** until Phase 9F (Physical Device Testing) and Phase 9G (Supabase Cloud Storage verification on Render) are successfully completed and approved.
