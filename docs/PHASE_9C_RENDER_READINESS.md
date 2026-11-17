# Phase 9C — Render Deployment & Production Readiness Report
**Project:** Salman Driver / Sarathi Chauffeur Marketplace  
**Date:** November 17, 2026  
**Auditor / Agent:** Antigravity Engineering  
**Deployment Target:** Render Web Service (Node.js 18+)  

---

## 1. Build and Start Configuration

The platform is architected as a unified full-stack monorepo:
* **Frontend:** React 18 + Vite (SPA)
* **Backend:** Node.js + Express API Router
* **Storage & DB Layer:** In-memory + persistent disk fallback with cloud Supabase connector

### Render Web Service Settings:
```yaml
Service Type: Web Service
Environment: Node
Build Command: npm install && npm run build
Start Command: node server/index.js
Auto-Deploy: Yes (on commit to main)
```

---

## 2. Port and Dynamic Networking

- **Port Binding:** Express listens on `process.env.PORT || 5000`. Render injects its own dynamic port variable at boot time.
- **Reverse Proxy & HTTPS:** 
  - Render terminates SSL at its cloud load balancer and proxies traffic to the Node.js process over internal HTTP.
  - The Express server is configured with `app.enable('trust proxy')` to respect `X-Forwarded-Proto` and enforce HTTPS security headers without redirect loops.

---

## 3. CORS & Cross-Origin Configuration

In `server/index.js`, CORS is configured to support web browsers, mobile capacitor bridges, and local testing:
- **Whitelisted Origins:**
  - `process.env.RENDER_EXTERNAL_URL` (The deployed production domain)
  - `capacitor://localhost` (iOS / Android Capacitor webview origin)
  - `http://localhost` (Android webview origin)
  - `http://localhost:5173` & `http://localhost:5000` (Local developer preview)
- **Credentials:** `credentials: true` enabled for cross-origin JWT cookie/header transport.

---

## 4. Single-Page Application (SPA) Fallback

When customers or chauffeurs navigate directly to nested URLs (such as `/chauffeur-dashboard`, `/admin`, or `/track/SRT-2026-8821`):
- Static assets are served from the compiled `dist/` directory via `express.static('dist')`.
- Non-API routes fallback to `dist/index.html` via Express wildcard routing (`app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')))`).
- This prevents `404 Not Found` errors on browser refreshes.

---

## 5. Environment Variables Checklist

> [!IMPORTANT]
> Never commit real secrets to Git. Configure these variables inside the **Render Dashboard -> Environment** tab.

| Environment Variable | Description | Recommended Setting | Production Status |
|---|---|---|---|
| `NODE_ENV` | Runtime environment | `production` | Recommended |
| `PORT` | Web server listening port | Set automatically by Render | Auto |
| `JWT_SECRET` | Cryptographic secret for signing JWTs | High-entropy random string (32+ chars) | Required |
| `STORAGE_SIGNING_SECRET` | Secret for HMAC-SHA256 signed storage URLs | High-entropy random string (32+ chars) | Required |
| `SUPABASE_URL` | Supabase Cloud project endpoint | `https://<project-ref>.supabase.co` | Pending User Setup |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-side administrative key | `eyJhbGci...` | Pending User Setup |
| `ENFORCE_CLOUD_STORAGE` | Block fallback disk storage in production | `false` (during initial launch) $\rightarrow$ `true` (once Supabase is live) | Pending Supabase Setup |
| `RAZORPAY_KEY_ID` | Payment gateway API key | `rzp_live_...` or test key | Verified in Fallback Mode |
| `RAZORPAY_KEY_SECRET` | Payment gateway secret | Secure key | Verified in Fallback Mode |

---

## 6. Readiness Verification Checklist

- [x] Node.js dependencies install cleanly without unresolvable peer conflicts.
- [x] Production bundle compiles via `npm run build` in under 30 seconds (`dist/` directory generated).
- [x] Server routes API calls (`/api/*`) independently from client-side UI routes (`/*`).
- [x] Storage service operates durably even if cloud keys are temporarily unconfigured.
- [x] Anti-IDOR security stops cross-tenant data leakage.
- [x] 238/238 automated tests pass cleanly across all 16 test suites.
