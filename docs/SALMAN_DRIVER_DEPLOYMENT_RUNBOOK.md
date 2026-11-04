# SARATHI / SALMAN DRIVER — TECHNICAL OPERATIONS & DEPLOYMENT RUNBOOK

> **Audience**: Technical Operators, System Administrators, DevOps Engineers  
> **Milestone**: Phase 9C / Phase 10 Production Staging Readiness  
> **Environment**: Windows Server / Linux Ubuntu 22.04 LTS / Cloud Platforms  

---

## 1. System Prerequisites & Environment Matrix

### Hardware & Runtime Requirements
- **Node.js**: v18.17.0 LTS or v20.x LTS
- **Package Manager**: npm 9+ or pnpm 8+
- **RAM**: Minimum 2 GB (4 GB recommended for production builds)
- **Disk Space**: 1 GB free space for node_modules, build artifacts, and persistent state

### Environment Variable Matrix (`.env`)

| Variable Name | Required For | Default / Staging Value | Production Requirement |
| :--- | :--- | :--- | :--- |
| `PORT` | API & Static Server | `5002` | Port `80` / `443` or reverse proxy port |
| `NODE_ENV` | Environment Flag | `development` / `staging` | `production` |
| `JWT_SECRET` | Token Cryptography | Auto-fallback (staging) | 64-char high-entropy cryptographic secret |
| `ADMIN_PASSWORD` | Admin Portal Security | Demo credentials (staging) | High-entropy string (Min 16 chars) |
| `VITE_SUPABASE_URL` | Cloud Database | *(Empty: Uses Local JSON)* | Live Supabase project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Client DB Access | *(Empty: Uses Local JSON)* | Supabase Anon Public API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB Access | *(Empty: Uses Local JSON)* | Supabase Service Role Secret Key |
| `RAZORPAY_KEY_ID` | Payment Processing | Sandbox Key | Live Production Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Payment Verification | Sandbox Secret | Live Production Razorpay Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook Verification | Sandbox Secret | Live Webhook Signature Secret |
| `GOOGLE_MAPS_API_KEY` | Real Geocoding / Maps | Fallback geometry | Google Maps Platform API Key |
| `SMS_GATEWAY_API_KEY` | Live DLT SMS Delivery | Simulated OTP | DLT-registered SMS provider key |

---

## 2. Local & Staging Server Launch Procedure

### Standard Launch via Automated PowerShell Script
For rapid founder demonstration and staging verification:
```powershell
cd c:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app
powershell -ExecutionPolicy Bypass -File .\scripts\start_founder_demo.ps1
```

The script automatically executes:
1. Environment pre-flight check (`package.json`, `node_modules`).
2. Production build verification (`npm run build`).
3. Port conflict resolution on port 5002.
4. Starts the Node.js Express server hosting both API and compiled frontend assets.
5. Displays operational endpoints and safety credentials.

### Manual Direct Launch
```bash
cd driver-rental-app
npm run build
node server/index.js
```
The server will bind to `http://localhost:5002`.

---

## 3. Cloudflare Tunnel Setup for Secure Mobile Testing

To allow Salman or remote stakeholders to test the application on physical mobile devices without port forwarding or exposing local firewall ports:

### Step 1: Install Cloudflare Tunnel Client (`cloudflared`)
- **Windows**: `winget install --id Cloudflare.cloudflared` or download from [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases).
- **macOS / Linux**: `brew install cloudflared` or `sudo apt-get install cloudflared`.

### Step 2: Establish Ad-Hoc Secure Tunnel
Run the following command while the Sarathi server is running on port 5002:
```bash
cloudflared tunnel --url http://localhost:5002
```

### Step 3: Extract and Share the Staging URL
`cloudflared` will generate a public HTTPS URL resembling:
```
https://random-words-1234.trycloudflare.com
```
- Share this HTTPS URL with Salman for mobile testing.
- **Security Note**: Admin endpoints (`/admin`) are protected by PIN / JWT authentication. When sharing public tunnel URLs, ensure default administrative credentials are never broadcast publicly.

---

## 4. Hosted Supabase PostgreSQL Configuration & Migration

When moving from local JSON persistence to persistent hosted Supabase:

### Step 1: Create Supabase Project
1. Log in to [Supabase Console](https://supabase.com).
2. Create a new organization and project (e.g., `sarathi-prod-blr`).
3. Note the Database Password, Project URL, and API Keys.

### Step 2: Execute Schema Migrations
The repository includes 4 comprehensive SQL migration files in `supabase/migrations/`:
- `001_initial_schema.sql`: 19 core tables, indexes, constraints.
- `002_rls_policies.sql`: 12 Row-Level Security policies.
- `003_payments_and_communications.sql`: Financial ledgers, settlement tables.
- `004_premium_features.sql`: Corporate profiles and specialty vehicle records.

Run the migration script:
```bash
npm run migrate
```
The script validates database connectivity, audits table structures, and ensures all RLS policies are applied.

---

## 5. External Provider Activation Runbook

### A. Razorpay Live Payments
1. Complete Razorpay Business Account KYC verification at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Generate Live API Key ID and Key Secret.
3. In Razorpay Webhook settings, register endpoint `https://<your-domain>/api/payments/webhook`.
4. Enable events: `payment.captured`, `payment.failed`, `refund.processed`.
5. Update `.env` with `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.

### B. SMS & Telecom DLT Compliance (India)
1. Register legal entity on an Indian Telecom DLT portal (e.g., Jio, Airtel, Vodafone-Idea).
2. Register Sender ID / Header (e.g., `SARATH`).
3. Register Content Templates for OTP:
   - *"Your Sarathi login verification OTP is {#var#}. Valid for 10 minutes. Do not share with anyone."*
   - *"Your Sarathi driver arrival OTP is {#var#}. Share with your chauffeur to start the trip."*
4. Insert DLT Entity ID and Template IDs into SMS Gateway configuration.

### C. Google Maps Platform
1. Create a project in Google Cloud Console with billing attached.
2. Enable APIs: Maps JavaScript API, Geocoding API, Distance Matrix API, Directions API.
3. Restrict API Key by HTTP referrer to your production domain (`https://sarathidriver.in/*`).
4. Set `GOOGLE_MAPS_API_KEY` in environment variables.

---

## 6. Process Management & Production Supervision

For continuous cloud deployment on Ubuntu Linux servers:

### Using PM2 Process Manager
```bash
# Install PM2 globally
npm install -g pm2

# Start application in cluster mode
pm2 start server/index.js --name "sarathi-api" -i max --env production

# Save process list and enable on system boot
pm2 save
pm2 startup
```

### Monitoring & Log Management
```bash
# View live log stream
pm2 logs sarathi-api

# Inspect resource utilization
pm2 monit
```

---

## 7. Backup, Disaster Recovery & Rollback

### Data Backup Procedure
- **Staging / Local Mode**: Daily automated file backup of `server/db/persistentData.json` to encrypted storage.
- **Supabase Cloud Mode**: Automated daily WAL archiving and point-in-time recovery (PITR) managed in Supabase dashboard. Manual SQL dump:
  ```bash
  supabase db dump --data-only > backup_$(date +%Y%m%d).sql
  ```

### Rollback Procedure
If a deployment fails or critical defects occur in production:
1. Revert git working tree to the verified checkpoint tag:
   ```bash
   git checkout checkpoint-phase-9c-complete
   ```
2. Re-run dependency audit and production build:
   ```bash
   npm ci
   npm run build
   ```
3. Restart process manager:
   ```bash
   pm2 restart sarathi-api
   ```
4. Verify system health via automated regression suite:
   ```bash
   node tests/run_all_tests.js
   node scripts/verify_complete_workflows.js
   ```
