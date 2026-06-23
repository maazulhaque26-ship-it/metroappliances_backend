const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const makeUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          `metroappliances/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      resource_type:   'image',
    },
  });
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
};

const upload         = makeUploader('products');
const reviewUpload   = makeUploader('reviews');
const categoryUpload = makeUploader('categories');
const singleUpload   = makeUploader('general');
const dealerUpload   = makeUploader('dealers');

// Service upload — accepts images, PDFs, and videos (for after-sales attachments)
const makeServiceUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:        `metroappliances/${folder}`,
      resource_type: 'auto',
    },
  });
  const serviceFilter = (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') ||
               file.mimetype === 'application/pdf' ||
               file.mimetype.startsWith('video/');
    if (ok) cb(null, true);
    else cb(new Error('Only image, PDF, or video files are allowed'), false);
  };
  return multer({ storage, fileFilter: serviceFilter, limits: { fileSize: 20 * 1024 * 1024 } });
};
const serviceUpload = makeServiceUploader('service');

// Extract Cloudinary public_id from a URL for deletion.
// URL pattern: .../upload/v<timestamp>/<public_id>.<ext>
function cloudinaryPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  return parts[1].replace(/^v\d+\//, '').replace(/\.[^.]+$/, '');
}

module.exports = { cloudinary, upload, reviewUpload, categoryUpload, singleUpload, dealerUpload, serviceUpload, cloudinaryPublicId };
