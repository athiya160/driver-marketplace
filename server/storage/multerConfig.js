import multer from 'multer';
import path from 'path';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Memory storage keeps file buffers accessible for SHA-256 calculation & dual-mode upload
const memoryStorage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return cb(new Error(`INVALID_FILE_TYPE: Unsupported MIME type '${file.mimetype}'. Allowed: JPEG, PNG, WebP, PDF`), false);
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`INVALID_FILE_EXTENSION: Unsupported extension '${ext}'. Allowed: .jpg, .jpeg, .png, .webp, .pdf`), false);
    }

    cb(null, true);
  }
});
