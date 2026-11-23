# Phase 9F — Motorola Moto G35 5G Physical Device Testing Report

**Project:** Salman Driver / Sarathi Chauffeur Marketplace  
**Milestone:** Phase 9F — Physical Device Testing & Hardware Verification  
**Date:** November 17, 2026  
**Auditor / Agent:** Antigravity Engineering  
**Application ID:** `in.sarathidriver.app`  
**Application Name:** Salman Driver  
**Version:** `1.0` (versionCode: `1`)  
**Target Device:** Motorola Moto G35 5G (Android 14 / Hello UI)  
**Binary Tested:** `SalmanDriver.apk` (6,805,363 bytes)  
**APK SHA-256 Checksum:** `A99DDD0D3B1CE966617228476903C81E977300D3D28706952EA4DF8F065C8DE9`  

---

## 1. ADB Connection & Device Discovery Audit

Before testing hardware features, ADB was executed to detect connected physical devices:

```powershell
& 'C:\Users\Athiya\AppData\Local\Android\Sdk\platform-tools\adb.exe' devices
```

### Discovery Result:
```
* daemon not running; starting now at tcp:5037
* daemon started successfully
List of devices attached
(No devices currently attached via active USB Debugging bridge)
```

> [!NOTE]
> Per the strict Phase 9F mandate: **No physical device results are fabricated.** Because the phone is either not yet connected via an active USB Debugging bridge or is being tested standalone via direct sideloading, hardware verification cases are cataloged below with exact expected outcomes and pending user verification.

---

## 2. Physical Device Test Matrix & Execution Status

| Test ID | Test Category | Specific Test Case | Expected Behavior | Physical Device Status | Notes / Instructions |
|---|---|---|---|---|---|
| **9F-DEV-01** | **Device & Install** | App Package Installation | Package installs clean with ID `in.sarathidriver.app`. | **PENDING** | Sideload `SalmanDriver.apk` via Files app. |
| **9F-DEV-02** | **Device & Install** | Cold Launch & Splash Screen | App opens to splash screen and navigates to main dashboard without crashing. | **PENDING** | Check for immediate blank screen or ANR. |
| **9F-DEV-03** | **Device & Install** | Preserved Data / No Auto-Wipe | Upgrading or installing does not wipe existing local storage cache. | **PENDING** | Local SQLite/Preferences preserved. |
| **9F-CUST-01** | **Customer Experience** | Customer Registration & Login | Customer enters phone/OTP, receives synthetic/SMS OTP, logs in. | **PENDING** | Phone verification flow. |
| **9F-CUST-02** | **Customer Experience** | Chauffeur Search & Filtering | Browses categories (Hourly, Outstation, Airport), filters by transmission (Automatic/Manual). | **PENDING** | Verifies Indian pricing engine (INR). |
| **9F-CUST-03** | **Customer Experience** | Driver Badges & Profiles | Profiles show verified badges (DL Verified, Aadhaar Verified) without PCC badge. | **PENDING** | Confirms PCC is completely absent from customer view. |
| **9F-CUST-04** | **Customer Experience** | Booking Creation & State Flow | Customer books driver, receives assigned driver status, views trip OTP. | **PENDING** | Complete booking lifecycle. |
| **9F-DRV-01** | **Chauffeur Experience** | Chauffeur Registration (No PCC) | Registration form asks for DL, Aadhaar, Profile Photo, **no PCC**. | **PENDING** | Crucial Phase 9D verification check. |
| **9F-DRV-02** | **Chauffeur Experience** | Driving Licence Upload | Front & Back DL capture triggers camera or gallery file picker. | **PENDING** | Test photo capture and preview. |
| **9F-DRV-03** | **Chauffeur Experience** | Aadhaar Card Upload | Aadhaar document selection succeeds, shows thumbnail. | **PENDING** | Document preview validation. |
| **9F-DRV-04** | **Chauffeur Experience** | Chauffeur Profile Photo | Headshot photo upload updates profile avatar. | **PENDING** | Verify image cropper/preview. |
| **9F-DRV-05** | **Chauffeur Experience** | KYC Submission & Approval | Chauffeur submits KYC documents; status reflects "Under Review" or "Verified". | **PENDING** | No missing-PCC blocking error. |
| **9F-HW-01** | **Android Hardware** | Camera Permission Prompt | Native Android 14 camera permission prompt appears when tapping camera icon. | **PENDING** | Tap "While using the app". |
| **9F-HW-02** | **Android Hardware** | Location Permission & GPS | App requests `ACCESS_FINE_LOCATION`; device coordinates resolve on map. | **PENDING** | Verifies device GPS sensor integration. |
| **9F-HW-03** | **Android Hardware** | Network Transition | Switching between 5G and Wi-Fi does not break active session or lose unsaved state. | **PENDING** | Test offline banner / reconnect toast. |
| **9F-HW-04** | **Android Hardware** | App Backgrounding & Resume | Pressing Home button and returning preserves current screen state without reload. | **PENDING** | Android activity lifecycle test. |
| **9F-HW-05** | **Android Hardware** | System Back Gesture / Nav Bar | Back gesture exits modals before navigating away from main screens. | **PENDING** | Capacitor back-button listener check. |
| **9F-SEC-01** | **Security & Privacy** | Cross-Driver Document Isolation | Chauffeur A cannot view or inspect Chauffeur B's Aadhaar or DL. | **PENDING** | Validated locally in suite 17. |
| **9F-SEC-02** | **Security & Privacy** | Permission Denial Resilience | Denying camera/location permissions shows user-friendly prompt rather than crashing. | **PENDING** | Graceful fallback test. |

---

## 3. How to Execute Physical Verification on Your Phone

You can complete this test through either of two approaches:

### Approach A: Standalone Phone Testing (Quickest)
1. Open [`SalmanDriver.apk`](file:///c:/Users/Athiya/Documents/antigravity/silly-oppenheimer/driver-rental-app/SalmanDriver.apk) on your Motorola Moto G35 5G.
2. Tap **Install** and then tap **Open**.
3. Perform the key tests:
   - **Launch:** Verify app opens without crashing.
   - **Driver Registration / KYC:** Go to Driver Onboarding, verify **Police Clearance (PCC)** is gone, and upload sample DL and Aadhaar photos.
   - **Customer Search:** Search for a driver, check prices in INR.
   - **Permissions:** Allow Location & Camera.
4. Share any observations or screenshots if an issue occurs.

### Approach B: ADB USB Debugging (Automated Logcat & Screen Capture)
If you wish for Antigravity to capture device logs and screenshots directly via ADB:
1. On your Moto G35 5G: **Settings > About phone > tap "Build number" 7 times**.
2. Go to **Settings > System > Developer options > turn ON "USB debugging"**.
3. Plug your phone into your PC with a USB cable.
4. On your phone screen, accept the popup: **"Allow USB debugging? Always allow from this computer" -> Allow**.
5. Antigravity can then automatically stream `adb logcat`, take screenshots, and run automated device health checks.

---

## 4. Release Advisory

> [!WARNING]
> Do not share this APK with Salman or publish to production until:
> 1. Physical verification on your Moto G35 5G is completed without crash regressions.
> 2. Supabase Storage is configured and verified on Render (Phase 9G).
