import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.join(__dirname, 'data');
const METADATA_FILE = path.join(__dirname, 'storageMetadata.json');
const STORAGE_SIGNING_SECRET = process.env.STORAGE_SIGNING_SECRET || process.env.JWT_SECRET || 'sarathi_driver_storage_secret_2026';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const ALLOWED_BUCKETS = ['driver-documents', 'vehicle-handovers', 'general-attachments', 'profile-photos'];

export class StorageService {
  constructor() {
    this.isLiveSupabase = Boolean(
      SUPABASE_URL &&
      SUPABASE_SERVICE_ROLE_KEY &&
      !SUPABASE_URL.includes('placeholder')
    );

    // Production safety check: Alert if running in hosted production without live cloud storage keys
    if (process.env.NODE_ENV === 'production' && !this.isLiveSupabase) {
      console.warn('[STORAGE ADVISORY] Running in production mode without live SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Local persistent store active.');
    }

    this.ensureLocalStorageDirs();
    this.metadata = this.loadMetadata();
  }

  ensureLocalStorageDirs() {
    if (!fs.existsSync(DATA_ROOT)) {
      fs.mkdirSync(DATA_ROOT, { recursive: true });
    }
    for (const b of ALLOWED_BUCKETS) {
      const bPath = path.join(DATA_ROOT, b);
      if (!fs.existsSync(bPath)) {
        fs.mkdirSync(bPath, { recursive: true });
      }
    }
  }

  loadMetadata() {
    try {
      if (fs.existsSync(METADATA_FILE)) {
        const raw = fs.readFileSync(METADATA_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load storageMetadata.json, starting fresh:', e.message);
    }
    return { files: [] };
  }

  saveMetadata() {
    try {
      fs.writeFileSync(METADATA_FILE, JSON.stringify(this.metadata, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write storageMetadata.json:', e.message);
    }
  }

  /**
   * Only profile-photos is public (driver and customer avatars).
   * All compliance docs (driver-documents), handover inspection photos (vehicle-handovers),
   * and private attachments (general-attachments) are STRICTLY PRIVATE.
   */
  isPrivateBucket(bucket) {
    return bucket !== 'profile-photos';
  }

  sanitizeFileName(originalName) {
    const parsed = path.parse(originalName);
    const cleanBase = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const ext = parsed.ext.toLowerCase();
    const unique = crypto.randomUUID().slice(0, 8);
    return `${cleanBase}_${unique}${ext}`;
  }

  validateBucket(bucket) {
    if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
      throw new Error(`INVALID_STORAGE_BUCKET: Bucket '${bucket}' is not permitted. Allowed buckets: ${ALLOWED_BUCKETS.join(', ')}`);
    }
  }

  validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('INVALID_FILE_PATH: File path must be a non-empty string');
    }
    const normalized = path.normalize(filePath).replace(/\\/g, '/');
    if (
      normalized.includes('..') ||
      normalized.startsWith('/') ||
      normalized.startsWith('\\') ||
      normalized.includes(':') ||
      normalized.includes('\0')
    ) {
      throw new Error('PATH_TRAVERSAL_DETECTED: Traversing or escaped file paths are strictly prohibited');
    }
    return normalized;
  }

  /**
   * Upload file to Supabase or local persistent store
   */
  async uploadFile({
    bucket,
    fileBuffer,
    originalName,
    mimeType,
    uploadedBy = 'system',
    uploadedRole = 'anonymous',
    docType = 'general',
    customFileName = null
  }) {
    this.validateBucket(bucket);
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) throw new Error('Valid file buffer is required');

    // Production safety invariant: Reject silent local fallback if ENFORCE_CLOUD_STORAGE is set in production
    if (process.env.NODE_ENV === 'production' && !this.isLiveSupabase && process.env.ENFORCE_CLOUD_STORAGE === 'true') {
      throw new Error('PRODUCTION_STORAGE_UNAVAILABLE: Cloud object storage (Supabase) credentials not configured on hosted environment.');
    }

    const fileName = customFileName || this.sanitizeFileName(originalName || 'file.bin');
    const cleanFile = this.validateFilePath(fileName);
    const filePath = cleanFile;
    const sizeBytes = fileBuffer.length;
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const isPrivate = this.isPrivateBucket(bucket);

    let storageProvider = 'local_disk';
    let cloudUploadUrl = null;

    // Mode 1: Supabase Storage Cloud API
    if (this.isLiveSupabase) {
      try {
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(filePath)}`;
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': mimeType || 'application/octet-stream',
            'x-upsert': 'true'
          },
          body: fileBuffer
        });

        if (res.ok) {
          storageProvider = 'supabase_storage';
          cloudUploadUrl = uploadUrl;
        } else {
          const errText = await res.text();
          console.warn(`Supabase Storage upload failed (${res.status}): ${errText}. Falling back to local storage.`);
        }
      } catch (err) {
        console.warn(`Supabase Storage upload network exception: ${err.message}. Falling back to local storage.`);
      }
    }

    // Always persist to local disk as primary or reliable fallback
    const fullDiskPath = path.resolve(DATA_ROOT, bucket, cleanFile);
    const bucketRoot = path.resolve(DATA_ROOT, bucket);
    if (!fullDiskPath.startsWith(bucketRoot)) {
      throw new Error('PATH_TRAVERSAL_DETECTED: Target path escapes bucket boundary');
    }
    const targetDir = path.dirname(fullDiskPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(fullDiskPath, fileBuffer);

    // Record metadata
    const record = {
      id: `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      bucket,
      filePath,
      originalName: originalName || fileName,
      mimeType: mimeType || 'application/octet-stream',
      sizeBytes,
      sha256,
      uploadedBy,
      uploadedRole,
      docType,
      isPrivate,
      storageProvider,
      uploadedAt: new Date().toISOString()
    };

    // Upsert metadata record
    this.metadata.files = this.metadata.files.filter(f => !(f.bucket === bucket && f.filePath === filePath));
    this.metadata.files.push(record);
    this.saveMetadata();

    // Determine initial access URL
    let accessUrl;
    if (isPrivate) {
      const signed = this.createSignedUrl(bucket, filePath, 900); // 15 min default
      accessUrl = signed.signedUrl;
    } else {
      accessUrl = `/api/storage/file/${bucket}/${encodeURIComponent(filePath)}`;
    }

    return {
      success: true,
      file: record,
      accessUrl,
      isPrivate
    };
  }

  /**
   * Retrieves binary buffer and metadata
   */
  async getFile({ bucket, filePath }) {
    try {
      this.validateBucket(bucket);
      const cleanFile = this.validateFilePath(filePath);

      // 1. Try local disk
      const fullDiskPath = path.resolve(DATA_ROOT, bucket, cleanFile);
      const bucketRoot = path.resolve(DATA_ROOT, bucket);
      if (!fullDiskPath.startsWith(bucketRoot)) {
        return { found: false, error: 'PATH_TRAVERSAL_DETECTED' };
      }
      if (fs.existsSync(fullDiskPath)) {
        const buffer = fs.readFileSync(fullDiskPath);
        const meta = this.metadata.files.find(f => f.bucket === bucket && f.filePath === cleanFile);
        return {
          found: true,
          buffer,
          mimeType: meta?.mimeType || 'application/octet-stream',
          sizeBytes: buffer.length,
          originalName: meta?.originalName || path.basename(cleanFile),
          metadata: meta
        };
      }

      // 2. Try remote Supabase Storage if configured
      if (this.isLiveSupabase) {
        try {
          const fetchUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/${bucket}/${encodeURIComponent(cleanFile)}`;
          const res = await fetch(fetchUrl, {
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          });
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = res.headers.get('content-type') || 'application/octet-stream';
            return {
              found: true,
              buffer,
              mimeType: contentType,
              sizeBytes: buffer.length,
              originalName: cleanFile,
              metadata: null
            };
          }
        } catch (err) {
          console.warn(`Supabase Storage fetch failed for ${bucket}/${cleanFile}:`, err.message);
        }
      }

      return { found: false };
    } catch (e) {
      return { found: false, error: e.message };
    }
  }

  /**
   * Generates a cryptographically signed URL
   */
  createSignedUrl(bucket, filePath, expiresInSeconds = 900) {
    this.validateBucket(bucket);
    const cleanFile = this.validateFilePath(filePath);
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${bucket}:${cleanFile}:${exp}`;
    const token = crypto
      .createHmac('sha256', STORAGE_SIGNING_SECRET)
      .update(payload)
      .digest('hex');

    const signedUrl = `/api/storage/signed/${bucket}/${encodeURIComponent(cleanFile)}?token=${token}&expires=${exp}`;
    return {
      signedUrl,
      expiresAt: new Date(exp * 1000).toISOString(),
      expiresInSeconds
    };
  }

  /**
   * Validates signed URL token
   */
  verifySignedUrl(bucket, filePath, token, expires) {
    try {
      this.validateBucket(bucket);
      const cleanFile = this.validateFilePath(filePath);

      if (!token || !expires) {
        return { valid: false, reason: 'Missing signature token or expiration timestamp' };
      }
      const expNum = parseInt(expires, 10);
      const now = Math.floor(Date.now() / 1000);

      if (isNaN(expNum) || expNum < now) {
        return { valid: false, reason: 'Signed document URL has expired' };
      }

      const payload = `${bucket}:${cleanFile}:${expNum}`;
      const expected = crypto
        .createHmac('sha256', STORAGE_SIGNING_SECRET)
        .update(payload)
        .digest('hex');

      // Timing-safe comparison to prevent side-channel timing attacks
      const tokenBuf = Buffer.from(token);
      const expectedBuf = Buffer.from(expected);
      if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
        return { valid: false, reason: 'Invalid cryptographic document signature' };
      }

      return { valid: true, expiresAt: new Date(expNum * 1000).toISOString() };
    } catch (err) {
      return { valid: false, reason: err.message };
    }
  }

  /**
   * Verify whether a caller is authorized to access a private file
   */
  canUserAccessFile(caller, bucket, filePath, persistentStorageInstance = null) {
    if (!caller) return false;
    if (caller.role === 'admin') return true;

    // Public bucket allows all
    if (!this.isPrivateBucket(bucket)) return true;

    let cleanFile;
    try {
      cleanFile = this.validateFilePath(filePath);
    } catch (e) {
      return false;
    }

    const meta = this.metadata.files.find(f => f.bucket === bucket && f.filePath === cleanFile);

    // 1. Direct metadata uploader match
    if (meta && (meta.uploadedBy === caller.id || meta.uploadedBy === caller.driverId)) {
      return true;
    }

    // 2. driver-documents: Chauffeur must own the document
    if (bucket === 'driver-documents') {
      if (caller.role === 'driver') {
        if (caller.driverId && cleanFile.includes(caller.driverId)) return true;
        if (caller.id && cleanFile.includes(caller.id)) return true;
        if (persistentStorageInstance) {
          const doc = persistentStorageInstance.findOne('driver_documents', d =>
            d.storagePath === cleanFile || d.fileUrl?.includes(cleanFile)
          );
          if (doc && (doc.driverId === caller.driverId || doc.driverId === caller.id)) {
            return true;
          }
        }
      }
      return false;
    }

    // 3. vehicle-handovers: Customer of the booking or assigned Chauffeur
    if (bucket === 'vehicle-handovers') {
      if (meta && (meta.uploadedBy === caller.id || meta.uploadedBy === caller.driverId)) {
        return true;
      }
      if (persistentStorageInstance) {
        const handover = persistentStorageInstance.findOne('vehicle_handovers', h =>
          h.photoUrls?.some(url => url.includes(cleanFile))
        );
        if (handover) {
          const isCustomer = handover.customerId === caller.id;
          const isDriver = handover.driverId === caller.id || handover.driverId === caller.driverId;
          return isCustomer || isDriver;
        }
      }
      return false;
    }

    // 4. general-attachments
    if (bucket === 'general-attachments') {
      return meta ? (meta.uploadedBy === caller.id || meta.uploadedBy === caller.driverId) : false;
    }

    return false;
  }

  /**
   * Storage health and diagnostic status
   */
  getHealth() {
    return {
      status: 'HEALTHY',
      provider: this.isLiveSupabase ? 'supabase_storage' : 'local_persistent_disk',
      isLiveSupabase: this.isLiveSupabase,
      buckets: ALLOWED_BUCKETS,
      privateBuckets: ALLOWED_BUCKETS.filter(b => this.isPrivateBucket(b)),
      publicBuckets: ALLOWED_BUCKETS.filter(b => !this.isPrivateBucket(b)),
      totalFiles: this.metadata.files.length,
      privateFiles: this.metadata.files.filter(f => f.isPrivate).length,
      storageDirectory: DATA_ROOT,
      note: this.isLiveSupabase
        ? 'Connected to live Supabase Storage cloud backend.'
        : 'Running in resilient local disk mode. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment for hosted cloud object storage.'
    };
  }
}

export const storageService = new StorageService();
