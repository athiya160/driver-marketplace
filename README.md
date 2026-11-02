# 🚗 Sarathi (सारथी) – Driver Rental Booking Platform Across India

> **"Apni Gaadi, Bharosemand Sarathi"** (Your Car, Trusted Chauffeur)  
> Production-grade driver rental booking platform connecting vehicle owners across India with verified personal drivers for **Hourly, Full-Day, Outstation, One-Way, Round-Trip, Monthly, Airport, and Emergency services**.

---

## 🌟 Key Features & Indian Market Capabilities

1. **All 9 Driver Rental Categories:**
   - ⏱️ **Hourly Rental** (Min 2 Hours • Shopping, local errands, nightlife, meetings)
   - ☀️ **Full-Day City Chauffeur** (8 to 12 Hours • Multiple city stops)
   - 🛣️ **Outstation & Highway** (Per-day rate • Delhi–Agra, Mumbai–Pune, Bangalore–Mysore)
   - ➡️ **One-Way Intercity Drop** (Interstate vehicle relocation)
   - 🔁 **Round-Trip Weekend Getaway** (24-hour trips with personal chauffeur)
   - 📅 **Monthly Dedicated Chauffeur** (Executive corporate & family commute, 26 days/month)
   - 🔄 **Temporary Replacement Driver** (Leave cover for personal drivers)
   - ✈️ **Airport Flight-Safe Transfer** (IGI T3, BOM, BLR, HYD pickup/drop)
   - ⚡ **Express 30-Min Emergency Dispatch** (Rapid chauffeur arrival at your doorstep)

2. **Vehicle Specification Support:**
   - **Transmission:** Manual (MT) vs Automatic (AT, CVT, DSG, DCT)
   - **Body Category:** Hatchback, Sedan, SUV/MUV, Luxury (Audi, BMW, Mercedes, Jaguar)

3. **Transparent Indian Fare Engine (INR ₹):**
   - Configurable Base Fare + Extra Hours
   - **Night Allowance (₹250):** Automatically applied for trips between 10:00 PM and 06:00 AM
   - **Outstation Driver Daily Allowance (DA ₹350):** For driver food & lodging
   - **Platform Convenience Fee (₹49)**
   - **5% GST** compliant with Indian Road Transport Aggregator regulations
   - Promo coupon discounts (`FIRST50`, `WEEKEND100`, `SARATHI15`)
   - Driver Net Payout: 85% + 100% DA; Platform Commission: 15% + ₹49

4. **Driver Booking Conflict Prevention Engine:**
   - Checks temporal overlap across driver's active and scheduled bookings.
   - Enforces a mandatory **30-minute transit buffer** between consecutive rides.

5. **Security & Identity Verification (KYC):**
   - Police Clearance Certificate (PCC) verification badges.
   - Commercial Driving Licence & Aadhaar UIDAI verification.
   - **Trip Start 4-Digit OTP & Encrypted QR Code Check-In** (prevents unauthorized boarding).
   - Emergency SOS hotline (Indian Emergency 112 direct alert).
   - In-App phone number masking for female passenger & privacy safety under the **Indian DPDP Act, 2023**.

6. **Interactive Visual GPS Map:**
   - Real-time map component showing pickup pin, destination pin, animated driver vehicle movement, and road landmarks (DLF Crest, Cyber Hub, Ambience Mall, Airport).

7. **In-App Notifications Drawer:**
   - Real-time notification center with unread badge counter for driver arrival, booking status updates, security check-in OTP, and Razorpay payment confirmations.

8. **Authentication & Onboarding Suite:**
   - Dedicated Splash Screen, 3-step Onboarding Carousel, Login, Sign Up, 4-digit OTP Verification, and Password Reset.

9. **Dedicated Driver Profile Details Modal:**
   - Full chauffeur credentials, driving license verification, user reviews list, punctuality/skill score breakdown, and vehicle specializations.

10. **Indian Payments:**
   - **Razorpay Sandbox Gateway:** Instant UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (RuPay, Visa, Mastercard), Net Banking (SBI, HDFC, ICICI, Axis), and Cash on Completion.
   - Downloadable & Printable **GST Tax Invoices** (with SAC 996601 & CGST/SGST split).

11. **📱 Expo Go App Scanner & Generator ("app ka scanner b generate b kar"):**
   - Dedicated QR code generator utility outputs terminal ASCII QR, PNG image, and interactive web QR preview for instant scanning on Android and iOS devices.

12. **Admin Operations Center:**
   - Driver KYC verification queue with document previews (Approve, Reject with reason, Suspend).
   - Fleet manager across major Indian cities (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Chandigarh, Kochi).
   - National pricing rules & commission configuration.
   - Operating cities manager with rate configuration.
   - Transactions & refund management with Razorpay integration.
   - Customer complaints & support ticket resolution.

---

## 🏗️ Project Architecture & Tech Stack

```
driver-rental-app/
├── server/
│   ├── index.js              # Standalone Express Server (Port 5000)
│   ├── apiRouter.js          # REST Endpoints (Auth, Drivers, Bookings, KYC, Admin)
│   ├── pricingEngine.js      # Indian Rupee Fare Calculator (Night charges, DA, GST)
│   ├── conflictEngine.js     # Temporal Non-Overlap Booking Conflict Engine
│   └── mockDb.js             # Realistic Seed Store (10+ Indian verified drivers, bookings)
├── src/
│   ├── components/
│   │   ├── DeviceFrame.jsx          # Mobile Phone Frame (iPhone 16) & Role Switcher
│   │   ├── InteractiveMap.jsx       # Real-Time Visual GPS Route & Car Map
│   │   ├── NotificationDrawer.jsx   # In-App Live Notifications Center
│   │   ├── TripQRScannerModal.jsx   # In-App Camera QR Code Scanner & OTP Check-In
│   │   ├── InvoiceModal.jsx         # Indian GST Tax Invoice Receipt
│   │   └── ReviewModal.jsx          # Star Rating & Detailed Feedback Modal
│   ├── screens/
│   │   ├── AuthModal.jsx                 # Splash, Onboarding Carousel, Login, Sign Up & OTP
│   │   ├── CustomerHomeScreen.jsx        # Location, Categories, Car Type, Date/Time & Map
│   │   ├── DriverSearchResultsScreen.jsx # Filtered Chauffeur Cards & Masked Call
│   │   ├── DriverProfileDetailsModal.jsx # Detailed Driver Bio, Reviews, Badges & Booking
│   │   ├── BookingFlowScreen.jsx         # Fare Breakdown, Coupon & Razorpay UPI Pay
│   │   ├── LiveTripStatusScreen.jsx      # Stepper, Live Map, Trip OTP, QR Code & Meter
│   │   ├── CustomerProfileScreen.jsx     # Saved Addresses, Trips, DPDP Export
│   │   ├── DriverDashboardScreen.jsx     # Online Toggle, Calendar, Requests, Earnings, KYC
│   │   ├── AdminDashboardScreen.jsx      # KYC Review, Fleet, Pricing, Cities, Refunds, Tickets
│   │   └── AppScannerScreen.jsx          # Mobile QR Scanner Screen for Expo Go
│   ├── App.jsx               # Master React State & Screen Router
│   ├── api.js               # Client API Service
│   ├── constants.js         # Indian Cities, Car Types & Services
│   └── main.jsx             # React 18 Bootstrap
├── scripts/
│   └── generate_app_qr.js   # QR Code Generator for Terminal, PNG & HTML
├── tests/
│   └── driver_app.test.js   # Automated Test Suite (14 Tests)
├── public/
│   ├── expo_qr_code.png     # Scannable Expo QR Code
│   ├── trip_sample_qr.png   # Sample Trip QR Code
│   └── qr_preview.html      # Interactive Mobile Scanner Web Page
├── supabase_schema.sql      # Supabase PostgreSQL Database Schema, RLS & Seed Data
├── app.json                 # Expo React Native App Configuration
├── App.js                   # React Native Mobile Entrypoint
├── package.json             # NPM Scripts & Dependencies
└── .env                     # Environment Variables
```

---

## 🚀 Quick Start Guide

### 1. Run Automated Test Suite
```bash
npm test
# Or: node tests/driver_app.test.js
```
*Output: 14/14 automated tests passing.*

### 2. Generate the Mobile QR Code Scanner ("app ka scanner b generate b kar")
```bash
npm run generate-qr
```
This prints the ASCII QR code in your terminal, saves `public/expo_qr_code.png`, and generates `public/qr_preview.html`.

### 3. Start the Application & Dev Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

- Toggle between **Mobile Phone Frame (iPhone 16)** and **Desktop View** via the top toolbar.
- Switch between **Customer (Athiya)**, **Driver (Rajesh)**, and **Admin (Operations)** with 1-click role buttons.
- Click **"📱 App Scanner"** in the top bar to display the scannable Expo QR code.
- Click **"Auth"** in the top bar to test Splash screen, Onboarding walkthrough, Login/Signup, and OTP verification.
- Click **Bell Icon** in the top bar to inspect in-app alerts and notifications.

---

## 🛡️ License
MIT License • Developed with Google DeepMind Advanced Agentic Coding for Sarathi Mobility Technologies India.
