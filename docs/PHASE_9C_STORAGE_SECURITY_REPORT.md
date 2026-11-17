# Phase 9C — Storage Security & Anti-IDOR Hardening Report
**Project:** Salman Driver / Sarathi Chauffeur Marketplace  
**Date:** November 17, 2026  
**Auditor / Agent:** Antigravity Engineering  
**Test Suite:** `tests/critical_storage_audit.test.js` (20/20 Tests Passing)  
**Overall Test Battery:** 16 Suites, 238/238 Tests Passing  

---

## 1. Executive Summary & Problem Remediation

During the Phase 9B storage audit, a critical security discrepancy was identified:
> **Previous Status:** `vehicle-handovers` was designated as publicly accessible without authentication.  
> **Security Risk:** Digital vehicle handover records contain customer license plates, pre-trip vehicle scratch/dent photos, odometer readings, fuel gauges, and customer digital signatures. Public unauthenticated access exposed sensitive customer vehicle data.  
> **Phase 9C Remediation:** All vehicle handovers and driver KYC documents have been locked down with **strict private bucket enforcement**, cryptographic HMAC-SHA256 signed URLs, and Anti-IDOR ownership checks.

---

## 2. Storage Bucket Policy Matrix

| Bucket Name | Privacy Level | Auth Required | Permitted Roles | Content Types Allowed | Max Size |
|---|---|---|---|---|---|
| `driver-documents` | **STRICT PRIVATE** | Yes (JWT) | Chauffeur (Owner only), SuperAdmin | JPEG, PNG, WebP, PDF | 10 MB |
| `vehicle-handovers` | **STRICT PRIVATE** | Yes (JWT / Signed URL) | Customer (Trip owner), Chauffeur (Trip driver), SuperAdmin | JPEG, PNG, WebP | 10 MB |
| `general-attachments` | **STRICT PRIVATE** | Yes (JWT) | SuperAdmin, Support Staff | JPEG, PNG, WebP, PDF | 10 MB |
| `profile-photos` | **PUBLIC** | No (Read), Yes (Write) | Public (Read), Profile Owner (Write) | JPEG, PNG, WebP | 5 MB |

---

## 3. Anti-IDOR (Insecure Direct Object Reference) Safeguards

Implemented directly in `server/storage/storageService.js` (`canUserAccessFile`) and enforced across all `/api/storage/*` and `/api/documents/*` endpoints:

1. **Driver Document Segregation:**
   - Chauffeur `drv_001` can only view/download documents tagged with `driverId: "drv_001"` or file paths under `drivers/drv_001/`.
   - Any attempt by chauffeur `drv_002` or an arbitrary customer account to view `drv_001`'s Police Clearance Certificate or Driving License is halted immediately with `HTTP 403 Forbidden` (`FORBIDDEN_STORAGE_ACCESS`).

2. **Vehicle Handover Inspection Protection:**
   - Only the customer who placed booking `SRT-2026-XXXX` or the chauffeur assigned to that specific booking can view the handover inspection photos and odometer readings.
   - External callers or unassigned drivers receive `HTTP 403 Forbidden`.

3. **SuperAdmin Audit Exemption:**
   - Authorized platform compliance administrators (`role: 'admin'`) retain access to verify documents and process KYC approvals.

---

## 4. Cryptographic Signed URLs & Expiry Invariants

For sharing private vehicle inspection evidence with insurance carriers or customer receipts without granting permanent file access:
- **Algorithm:** HMAC-SHA256 signature generated using `process.env.STORAGE_SIGNING_SECRET || JWT_SECRET`.
- **Payload:** Bucket name, normalized storage path, caller identity, and Unix epoch expiration timestamp (`exp`).
- **Tamper Protection:** Any alteration of the query signature, timestamp, or path invalidates the HMAC and results in `HTTP 403 Forbidden: Invalid or expired storage signature`.
- **Auto-Expiry:** Once the Unix epoch timestamp elapses, the signed URL returns `HTTP 403: Signature expired`.

---

## 5. Input Validation, Path Traversal & MIME Protection

1. **Path Traversal Shield:**
   - Rejects directory navigation sequences (`..`, `../`, `..\`).
   - Normalizes forward and backward slashes, blocking root escaping (`/`, `\`, `C:\`, null bytes `\0`).
   - Path resolution confirms that `path.resolve(DATA_ROOT, bucket, filePath)` remains strictly inside `DATA_ROOT/bucket/`.
2. **MIME & Extension Enforcement:**
   - Multi-part form uploads (`multerConfig.js`) validate both HTTP headers and filename extensions against whitelist: `['image/jpeg', 'image/png', 'image/webp', 'application/pdf']`.
   - Executables (`.exe`, `.sh`, `.bat`, `.js`, `.php`, `.svg`) are strictly rejected.

---

## 6. Supabase Cloud Storage Status

- **Dual-Mode Adapter:**
  - When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, the storage service bridges uploads to Supabase Storage Buckets.
  - When unconfigured (e.g. local development or before cloud secrets are provided), the platform gracefully falls back to durable disk storage in `server/storage/data/` with persistent indexing in `server/storage/storageMetadata.json`.
- **Production Safety Enforcement:**
  - If `NODE_ENV === 'production'` and cloud keys are missing, the server logs a security advisory:
    `⚠️ [STORAGE_ALERT] Running in PRODUCTION with LOCAL disk fallback storage.`
  - If `ENFORCE_CLOUD_STORAGE=true` is set, the server halts startup to prevent data loss on ephemeral container filesystems.
- **Honest Cloud Verification Status:**
  - `PARTIALLY VERIFIED / BLOCKED_ON_CREDENTIALS` on live Render deployment until real Supabase credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are entered in the Render Dashboard environment settings.

---

## 7. Automated Test Suite Results

All 20 security tests in `tests/critical_storage_audit.test.js` passed with zero errors:
```
--- 1. Multi-Format Upload & File Type Validation ---
  ✅ PASS: 1. Uploads synthetic JPEG to private "driver-documents" bucket
  ✅ PASS: 2. Uploads synthetic PDF Police Clearance Certificate
  ✅ PASS: 3. Uploads synthetic WebP vehicle handover inspection photo
  ✅ PASS: 4. Rejects disallowed storage bucket name
  ✅ PASS: 5. Rejects path traversal attack in file path

--- 2. Bucket Privacy & Direct Access Lockdown ---
  ✅ PASS: 6. All sensitive buckets are private by default (driver-documents, vehicle-handovers, general-attachments)
  ✅ PASS: 7. Direct unauthenticated HTTP access to "vehicle-handovers" is strictly REJECTED (401/403)
  ✅ PASS: 8. Direct unauthenticated HTTP access to "driver-documents" is strictly REJECTED (401/403)

--- 3. Anti-IDOR Cross-User Authorization Verification ---
  ✅ PASS: 9. Owner chauffeur can access their own uploaded document
  ✅ PASS: 10. Different chauffeur is REJECTED from accessing driver 1 document (Anti-IDOR)
  ✅ PASS: 11. Customer is REJECTED from accessing raw chauffeur KYC document (Anti-IDOR)
  ✅ PASS: 12. Platform Admin has authorized access to verify chauffeur compliance

--- 4. Cryptographic Signed URLs & Expiration Invariants ---
  ✅ PASS: 13. Generates time-limited HMAC-SHA256 signed URL for private vehicle handover
  ✅ PASS: 14. Valid signed URL streams binary data with correct Content-Type (image/webp)
  ✅ PASS: 15. Rejects tampered signature token
  ✅ PASS: 16. Rejects expired signed URL

--- 5. Persistence, Restarts & Database Metadata Durability ---
  ✅ PASS: 17. Re-instantiated StorageService restores full metadata index and binary access
  ✅ PASS: 18. Submitting driver KYC persists storagePath in persistentStorage

--- 6. Storage Diagnostics & Public Avatar Support ---
  ✅ PASS: 19. Public "profile-photos" bucket serves avatars without token requirement
  ✅ PASS: 20. Storage health diagnostics report all private and public bucket configurations
```
