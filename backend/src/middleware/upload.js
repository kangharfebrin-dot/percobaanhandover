const multer = require('multer');

/**
 * Centralized file upload middleware with security controls:
 * - In-memory storage for sharp optimization pipeline
 * - 10MB maximum file size limit
 * - Strict image MIME type whitelist (JPEG, PNG, WebP)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Format file tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.');
      error.statusCode = 400;
      cb(error, false);
    }
  }
});

module.exports = upload;
