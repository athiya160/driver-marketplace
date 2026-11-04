# SARATHI / SALMAN DRIVER — FOUNDER MOBILE TESTING CHECKLIST

> **Audience**: Salman (Founder / Product Owner)  
> **Target Devices**: Mobile Smartphone (iOS Safari / Android Chrome) + Desktop Laptop  
> **Goal**: Step-by-step functional walkthrough of the live staging environment to evaluate UX, verify booking flow, and sign off on platform behavior.

---

## 🛠️ Step 0: Pre-Testing Setup & Access

1. **Accessing the Staging Link**:
   - Open the private secure staging URL provided by the technical operator on your mobile smartphone browser (or laptop browser).
   - *Example Tunnel URL*: `https://salman-demo.trycloudflare.com` or local `http://localhost:5002`.
2. **Device Recommendation**:
   - For the best testing experience, use two devices or two separate browser tabs:
     - **Device / Tab A (Customer)**: Standard mobile browser window.
     - **Device / Tab B (Chauffeur)**: Private/Incognito browser window.

---

## 📱 Phase 1: Customer Booking Walkthrough

| Step | Action | Expected Behavior | Tested? |
| :--- | :--- | :--- | :---: |
| **1.1** | Open the homepage (`/`) on mobile. | Splash hero loads with tagline: *"Your Car. Your Journey. Your Driver."* Clean, modern UI with city selector set to Bengaluru (or your current metro). | [ ] |
| **1.2** | Select Service Type: Tap **Hourly Rental** or **One-Way Drop**. | Active package tabs dynamically update: 2 hrs (20 km), 4 hrs (40 km), 8 hrs (80 km), 12 hrs (120 km). | [ ] |
| **1.3** | Enter Pickup & Destination: e.g., *Indiranagar* to *Bengaluru International Airport*. | Address autofill populates; route estimate calculates distance and transit duration. | [ ] |
| **1.4** | Select Vehicle Transmission: Choose **Manual** or **Automatic**. | Interface confirms vehicle preference so only compatible chauffeurs are assigned. | [ ] |
| **1.5** | Review Fare Breakdown: Tap **View Fare Estimate**. | Fare calculation displays transparent breakdown. Highlighted banner confirms: **Founding Launch Offer: ₹0 Platform Fee**. | [ ] |
| **1.6** | Confirm Booking: Tap **Request Driver Now**. | Loading radar appears searching for nearby verified chauffeurs. Booking confirmed with a unique **4-Digit Trip OTP** displayed on screen. | [ ] |
| **1.7** | Inspect Safety & Tracking: Scroll down active trip card. | Map displays simulated driver location, vehicle specs, and direct **Call Chauffeur** & **Emergency SOS** buttons. | [ ] |

---

## 🚗 Phase 2: Chauffeur Experience Walkthrough

| Step | Action | Expected Behavior | Tested? |
| :--- | :--- | :--- | :---: |
| **2.1** | Open Chauffeur Portal (`/driver` or `/partner`) in a private tab. | Chauffeur dashboard loads displaying driver profile, current rating (e.g., 4.9★), and weekly earnings summary. | [ ] |
| **2.2** | Toggle Availability: Tap the **Online / Offline** switch. | Switch turns green showing **"You are Online & Receiving Rides"**. System registers driver in the live dispatch pool. | [ ] |
| **2.3** | Receive Dispatch Alert: When Customer books (Phase 1.6). | Real-time dispatch card pops up with audio/visual prompt: shows pickup address, car transmission type, and estimated earnings. | [ ] |
| **2.4** | Accept Booking: Tap **Accept Dispatch**. | Driver status transitions to **"Assigned to Trip"**. Route map updates with navigation to customer pickup location. | [ ] |
| **2.5** | Arrive & Trip Handshake: Tap **Arrived at Pickup**. | App prompts chauffeur to enter customer's secret 4-Digit Trip OTP before beginning the drive. | [ ] |
| **2.6** | Enter OTP & Start Journey: Input the customer's 4-digit code. | Secure handshake validates OTP. Trip state switches to **"In Progress"**. Live odometer and trip timer begin. | [ ] |
| **2.7** | End Journey & Payout: Tap **Complete Trip**. | Fare summary displays full customer payment amount. Confirms **100% Payout to Chauffeur (₹0 Commission Deducted)**. | [ ] |

---

## 💻 Phase 3: Operations SuperAdmin Walkthrough

| Step | Action | Expected Behavior | Tested? |
| :--- | :--- | :--- | :---: |
| **3.1** | Navigate to `/admin` on your laptop browser. | Secure Admin Login gate appears with PIN / password protection. | [ ] |
| **3.2** | Log in with authorized demo credentials. | Admin Control Center loads with live metrics: Active Drivers, Ongoing Trips, and Gross Booking Value. | [ ] |
| **3.3** | Inspect Fleet Radar & City Governance: Click **Operational Cities**. | View toggles for 10 Indian metropolitan regions. Toggle Bengaluru, Mumbai, or Delhi to see active coverage. | [ ] |
| **3.4** | Review Driver Verification Desk: Click **KYC Approvals**. | Inspect uploaded synthetic driver documents (Aadhaar, Driving License, Background Check). Click **Approve Document**. | [ ] |
| **3.5** | Audit Founding Promotion: Click **Pricing & Policies**. | View the live **Founding Launch Policy** toggle: verifies ₹0 customer booking fee and 0% driver commission. | [ ] |
| **3.6** | Audit Security Trails: Click **Audit Logs**. | Real-time immutable event log confirms timestamps for logins, OTP validations, and status approvals. | [ ] |

---

## 🔍 Phase 4: Edge Case & Quality Checks

- [ ] **Trip Cancellation**: As a customer, tap *Cancel Booking* before driver arrives. System asks for a cancellation reason and updates driver status back to Available.
- [ ] **Browser Refresh Resilience**: Refresh your mobile browser while in an active booking. The app restores your active trip state without losing data.
- [ ] **Mobile Responsiveness**: Test on different screen sizes (iPhone Safari, Android Chrome). Verify navigation bars, buttons, and maps fit comfortably without horizontal scrolling.

---

## 📝 Founder Feedback & Notes Form

Please use this section to write any impressions, UI polish suggestions, or preferred tweaks:

| Item | Founder Observations & Desired Adjustments | Priority (High / Med / Low) |
| :--- | :--- | :--- |
| **UI / Branding** | *e.g., Adjust brand color, tagline phrasing, or button labels.* | |
| **Fare Pricing** | *e.g., Modify base package rates or hourly kilometer limits.* | |
| **City Selection** | *e.g., Change launch city priority (Bengaluru first vs. Mumbai).* | |
| **Chauffeur UX** | *e.g., Driver card layout, sound alerts, or navigation links.* | |
| **General Notes** | | |

---

*Once you have completed this walkthrough and noted any feedback, inform the engineering team to finalize the production release candidate!*
