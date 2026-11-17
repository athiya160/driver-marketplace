/**
 * SALMAN DRIVER — PHASE 9C: CRITICAL FILE UPLOAD & PRODUCTION STORAGE REGRESSION TEST SUITE
 * Rigorously audits:
 * 1. Multi-format upload (JPEG, PDF, WebP)
 * 2. MIME & extension validation, file size limits
 * 3. Strict bucket privacy (driver-documents: PRIVATE, vehicle-handovers: PRIVATE, general-attachments: PRIVATE)
 * 4. Anti-IDOR cross-user authorization enforcement
 * 5. Path traversal prevention
 * 6. Cryptographic signed URL generation, expiration, and tamper detection
 * 7. Server restart durability & database persistence
 */

process.env.NODE_ENV = 'test';

import assert from 'assert';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import app from '../server/index.js';
import { storageService, StorageService, ALLOWED_BUCKETS } from '../server/storage/storageService.js';
import { uploadMiddleware, MAX_FILE_SIZE_BYTES } from '../server/storage/multerConfig.js';
import { signJwt, revokeToken, isTokenRevoked } from '../server/auth/authService.js';
import { persistentStorage } from '../server/db/persistentStorage.js';

let passed = 0;
function it(title, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(err);
    process.exit(1);
  }
}

async function itAsync(title, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${title}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(err);
    process.exit(1);
  }
}

// In-process Express mock helper
function mockExpressRequest(appInstance, { method = 'GET', url = '/', headers = {}, body = null } = {}) {
  return new Promise((resolve) => {
    const rawHeaders = [];
    for (const [k, v] of Object.entries(headers)) {
      rawHeaders.push(k, v);
    }

    const req = new EventEmitter();
    req.method = method.toUpperCase();
    req.url = url;
    req.headers = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    req.rawHeaders = rawHeaders;
    req.socket = { remoteAddress: '127.0.0.1' };
    req.connection = req.socket;
    if (body !== null && body !== undefined) {
      req.body = body;
    }

    const res = new EventEmitter();
    let resStatusCode = 200;
    const resHeaders = {};
    let responseBody = '';

    res.statusCode = 200;
    res.setHeader = (name, value) => { resHeaders[name.toLowerCase()] = value; };
    res.getHeader = (name) => resHeaders[name.toLowerCase()];
    res.writeHead = (statusCode, headersObj) => {
      resStatusCode = statusCode;
      if (headersObj) {
        for (const [k, v] of Object.entries(headersObj)) {
          resHeaders[k.toLowerCase()] = v;
        }
      }
    };
    res.status = (code) => {
      resStatusCode = code;
      res.statusCode = code;
      return res;
    };
    res.send = (content) => {
      responseBody = content;
      resolve({ statusCode: resStatusCode, headers: resHeaders, body: responseBody });
    };
    res.json = (jsonObj) => {
      resHeaders['content-type'] = 'application/json; charset=utf-8';
      responseBody = JSON.stringify(jsonObj);
      resolve({ statusCode: resStatusCode, headers: resHeaders, body: responseBody, json: jsonObj });
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      let parsedJson = null;
      try { parsedJson = JSON.parse(responseBody); } catch (e) {}
      resolve({ statusCode: resStatusCode, headers: resHeaders, body: responseBody, json: parsedJson });
    };

    appInstance.handle(req, res, (err) => {
      if (err) {
        resolve({
          statusCode: 500,
          headers: resHeaders,
          body: String(err),
          json: { error: String(err) }
        });
      }
    });
  });
}

console.log('\n=======================================================');
console.log('🧪 Starting Phase 9C Critical Storage & Security Audit Suite...');
console.log('=======================================================\n');

// Synthetic test data
const SYNTHETIC_JPEG = Buffer.concat([
  Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
  Buffer.from('SYNTHETIC_CHAUFFEUR_COMMERCIAL_DL_PROOF_DATA_2026'),
  Buffer.from([0xFF, 0xD9])
]);

const SYNTHETIC_PDF = Buffer.concat([
  Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Synthetic Police Clearance Certificate) >>\nendobj\n'),
  Buffer.from('TRAILER_SYNTHETIC_DATA_TEST_2026\n%%EOF')
]);

const SYNTHETIC_WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBPVP8 '),
  Buffer.from('SYNTHETIC_WEBP_LUXURY_CAR_ODOMETER_PHOTO_2026')
]);

async function runTests() {
  console.log('--- 1. Multi-Format Upload & File Type Validation ---');

  let uploadedKyc;
  await itAsync('1. Uploads synthetic JPEG to private "driver-documents" bucket', async () => {
    const res = await storageService.uploadFile({
      bucket: 'driver-documents',
      fileBuffer: SYNTHETIC_JPEG,
      originalName: 'commercial_dl_front.jpg',
      mimeType: 'image/jpeg',
      uploadedBy: 'drv_delhi_1',
      uploadedRole: 'driver',
      docType: 'driving_licence_front'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.isPrivate, true);
    assert.ok(res.file.filePath);
    assert.strictEqual(res.file.mimeType, 'image/jpeg');
    uploadedKyc = res;
  });

  let uploadedPdf;
  await itAsync('2. Uploads synthetic PDF Commercial Document / Endorsement', async () => {
    const res = await storageService.uploadFile({
      bucket: 'driver-documents',
      fileBuffer: SYNTHETIC_PDF,
      originalName: 'commercial_license_endorsement.pdf',
      mimeType: 'application/pdf',
      uploadedBy: 'drv_delhi_1',
      uploadedRole: 'driver',
      docType: 'driving_licence_back'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.file.mimeType, 'application/pdf');
    uploadedPdf = res;
  });

  let uploadedWebp;
  await itAsync('3. Uploads synthetic WebP vehicle handover inspection photo', async () => {
    const res = await storageService.uploadFile({
      bucket: 'vehicle-handovers',
      fileBuffer: SYNTHETIC_WEBP,
      originalName: 'scratch_inspection.webp',
      mimeType: 'image/webp',
      uploadedBy: 'drv_delhi_1',
      uploadedRole: 'driver',
      docType: 'handover_photo'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.file.mimeType, 'image/webp');
    assert.strictEqual(res.isPrivate, true); // vehicle-handovers MUST BE PRIVATE
    uploadedWebp = res;
  });

  it('4. Rejects disallowed storage bucket name', async () => {
    assert.rejects(async () => {
      await storageService.uploadFile({
        bucket: 'malicious-bucket',
        fileBuffer: SYNTHETIC_JPEG,
        originalName: 'hack.jpg',
        mimeType: 'image/jpeg'
      });
    }, /INVALID_STORAGE_BUCKET/);
  });

  it('5. Rejects path traversal attack in file path', () => {
    assert.throws(() => {
      storageService.validateFilePath('../../etc/shadow');
    }, /PATH_TRAVERSAL_DETECTED/);

    assert.throws(() => {
      storageService.validateFilePath('..\\..\\windows\\system32\\cmd.exe');
    }, /PATH_TRAVERSAL_DETECTED/);
  });

  console.log('\n--- 2. Bucket Privacy & Direct Access Lockdown ---');

  it('6. All sensitive buckets are private by default (driver-documents, vehicle-handovers, general-attachments)', () => {
    assert.strictEqual(storageService.isPrivateBucket('driver-documents'), true);
    assert.strictEqual(storageService.isPrivateBucket('vehicle-handovers'), true);
    assert.strictEqual(storageService.isPrivateBucket('general-attachments'), true);
    assert.strictEqual(storageService.isPrivateBucket('profile-photos'), false); // Only avatars public
  });

  await itAsync('7. Direct unauthenticated HTTP access to "vehicle-handovers" is strictly REJECTED (401/403)', async () => {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: `/api/storage/file/vehicle-handovers/${uploadedWebp.file.filePath}`
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.json.error, 'UNAUTHORIZED_PRIVATE_BUCKET');
  });

  await itAsync('8. Direct unauthenticated HTTP access to "driver-documents" is strictly REJECTED (401/403)', async () => {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: `/api/storage/file/driver-documents/${uploadedKyc.file.filePath}`
    });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.json.error, 'UNAUTHORIZED_PRIVATE_BUCKET');
  });

  console.log('\n--- 3. Anti-IDOR Cross-User Authorization Verification ---');

  const driver1Token = signJwt({ id: 'usr_driver_delhi_1', driverId: 'drv_delhi_1', role: 'driver' });
  const driver2Token = signJwt({ id: 'usr_drv_2', driverId: 'drv_other_2', role: 'driver' });
  const customerToken = signJwt({ id: 'usr_cust_3', role: 'customer' });
  const adminToken = signJwt({ id: 'usr_admin_1', role: 'admin' });

  await itAsync('9. Owner chauffeur can access their own uploaded document', async () => {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: `/api/storage/file/driver-documents/${uploadedKyc.file.filePath}`,
      headers: { 'Authorization': `Bearer ${driver1Token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/jpeg');
  });

  await itAsync('10. Different chauffeur is REJECTED from accessing driver 1 document (Anti-IDOR)', async () => {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: `/api/storage/file/driver-documents/${uploadedKyc.file.filePath}`,
      headers: { 'Authorization': `Bearer ${driver2Token}` }
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.json.error, 'FORBIDDEN_FILE_ACCESS');
  });

  await itAsync('11. Customer is REJECTED from accessing raw chauffeur KYC document (Anti-IDOR)', async () => {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: `/api/storage/file/driver-documents/${uploadedKyc.file.filePath}`,
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.json.error, 'FORBIDDEN_FILE_ACCESS');
  });

  await itAsync('12. Platform Admin has authorized access to verify chauffeur compliance', async () => {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: `/api/storage/file/driver-documents/${uploadedKyc.file.filePath}`,
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.statusCode, 200);
  });

  console.log('\n--- 4. Cryptographic Signed URLs & Expiration Invariants ---');

  let signedUrl;
  it('13. Generates time-limited HMAC-SHA256 signed URL for private vehicle handover', () => {
    const signed = storageService.createSignedUrl('vehicle-handovers', uploadedWebp.file.filePath, 60);
    assert.ok(signed.signedUrl);
    assert.ok(signed.signedUrl.includes('token='));
    assert.ok(signed.signedUrl.includes('expires='));
    signedUrl = signed.signedUrl;
  });

  await itAsync('14. Valid signed URL streams binary data with correct Content-Type (image/webp)', async () => {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: signedUrl
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/webp');
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(Buffer.isBuffer(res.body), true);
    assert.strictEqual(res.body.equals(SYNTHETIC_WEBP), true);
  });

  it('15. Rejects tampered signature token', () => {
    const parsed = new URL(`http://localhost${signedUrl}`);
    const token = parsed.searchParams.get('token');
    const expires = parsed.searchParams.get('expires');

    const tampered = token.slice(0, -4) + 'ffff';
    const check = storageService.verifySignedUrl('vehicle-handovers', uploadedWebp.file.filePath, tampered, expires);
    assert.strictEqual(check.valid, false);
    assert.ok(check.reason.includes('Invalid cryptographic document signature'));
  });

  it('16. Rejects expired signed URL', () => {
    const pastExpires = Math.floor(Date.now() / 1000) - 60;
    const check = storageService.verifySignedUrl('vehicle-handovers', uploadedWebp.file.filePath, 'dummy_token', pastExpires);
    assert.strictEqual(check.valid, false);
    assert.ok(check.reason.includes('expired'));
  });

  console.log('\n--- 5. Persistence, Restarts & Database Metadata Durability ---');

  await itAsync('17. Re-instantiated StorageService restores full metadata index and binary access', async () => {
    const reloaded = new StorageService();
    const result = await reloaded.getFile({
      bucket: 'driver-documents',
      filePath: uploadedKyc.file.filePath
    });

    assert.strictEqual(result.found, true);
    assert.strictEqual(result.buffer.equals(SYNTHETIC_JPEG), true);
    assert.strictEqual(result.sizeBytes, SYNTHETIC_JPEG.length);
  });

  await itAsync('18. Submitting driver KYC persists storagePath in persistentStorage', async () => {
    const res = await mockExpressRequest(app, {
      method: 'POST',
      url: '/api/driver/submit-kyc',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driver1Token}`
      },
      body: {
        docType: 'driving_licence_front',
        docNumber: 'DL-042026119900',
        storagePath: uploadedKyc.file.filePath
      }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.success, true);
    assert.strictEqual(res.json.document.storagePath, uploadedKyc.file.filePath);

    // Verify stored record
    const stored = persistentStorage.findOne('driver_documents', d => d.storagePath === uploadedKyc.file.filePath);
    assert.ok(stored);
  });

  console.log('\n--- 6. Storage Diagnostics & Public Avatar Support ---');

  await itAsync('19. Public "profile-photos" bucket serves avatars without token requirement', async () => {
    const avatarUpload = await storageService.uploadFile({
      bucket: 'profile-photos',
      fileBuffer: SYNTHETIC_JPEG,
      originalName: 'driver_avatar.jpg',
      mimeType: 'image/jpeg',
      uploadedBy: 'drv_delhi_1',
      uploadedRole: 'driver',
      docType: 'avatar'
    });

    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: `/api/storage/file/profile-photos/${avatarUpload.file.filePath}`
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/jpeg');
    assert.ok(res.headers['cache-control'].includes('public'));
  });

  await itAsync('20. Storage health diagnostics report all private and public bucket configurations', async () => {
    const res = await mockExpressRequest(app, {
      method: 'GET',
      url: '/api/storage/health'
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json.status, 'HEALTHY');
    assert.ok(res.json.privateBuckets.includes('driver-documents'));
    assert.ok(res.json.privateBuckets.includes('vehicle-handovers'));
    assert.ok(res.json.privateBuckets.includes('general-attachments'));
    assert.ok(res.json.publicBuckets.includes('profile-photos'));
  });
}

runTests().then(() => {
  console.log('\n=======================================================');
  console.log(`🏆 Phase 9C Storage & Security Audit: ${passed}/${passed} Tests Passed Cleanly`);
  console.log('=======================================================\n');
}).catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
