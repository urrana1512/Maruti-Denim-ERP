const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure avatars upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer memory storage (buffer in memory for magic byte sniffing)
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
    cb(null, true);
  }
});

// Magic Byte Content Sniffing & Image Processing Helper
const processAndSaveAvatar = async (buffer, userId) => {
  if (!buffer || buffer.length < 12) {
    throw new Error('Corrupted or invalid image buffer.');
  }

  // Magic Byte Content Sniffing
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error('Security Error: Uploaded file content does not match allowed image formats (JPEG/PNG/WebP).');
  }

  // Cryptographically safe unpredictable filename
  const safeFilename = `avatar_${userId}_${crypto.randomBytes(8).toString('hex')}.webp`;
  const outputPath = path.join(UPLOAD_DIR, safeFilename);

  // Re-encode through sharp: resize to 300x300, strip EXIF metadata, save as WebP
  await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(outputPath);

  return `/uploads/avatars/${safeFilename}`;
};

module.exports = {
  uploadAvatar: upload.single('avatar'),
  processAndSaveAvatar
};
