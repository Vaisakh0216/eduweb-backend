const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  ALLOWED_TYPES.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Invalid file type. Only JPEG, PNG, GIF and PDF are allowed.'), false);
};

/**
 * Creates a multer upload middleware that stores files in S3.
 * @param {string} folder - S3 folder prefix (e.g. 'daybook', 'admissions', 'payments')
 * @param {number} fileSizeLimit - max file size in bytes (default 5MB)
 */
const createS3Upload = (folder, fileSizeLimit = 5 * 1024 * 1024) =>
  multer({
    storage: multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${folder}/${uniqueSuffix}${path.extname(file.originalname)}`);
      },
    }),
    fileFilter,
    limits: { fileSize: fileSizeLimit },
  });

/**
 * Deletes a file from S3 by its key.
 * @param {string} key - S3 object key (e.g. 'daybook/1234-5678.png')
 */
const deleteFromS3 = async (key) => {
  if (!key) return;
  await s3.send(
    new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key })
  );
};

/**
 * Generates a pre-signed URL for a private S3 object.
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 */
const getSignedFileUrl = (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
};

module.exports = { createS3Upload, deleteFromS3, getSignedFileUrl };
