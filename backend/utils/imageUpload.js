const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

const FOLDER_BY_FIELD = {
  customerProfileImage: "customerProfile",
  ownerShopCertificate: "shopImage",
  shopFrontPhoto: "shopImage",
  shopInsidePhoto: "shopImage",
  serviceImages: "serviceImages",
  productImages: "productImages",
  staffProfile: "staffProfiles",
  ownerProfileImage: "ownerProfile",
};

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const getSubFolder = (fieldname) => FOLDER_BY_FIELD[fieldname] || "misc";

const getLocalUploadBase = () =>
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(getLocalUploadBase(), getSubFolder(file.fieldname));
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage =
    ALLOWED_IMAGE_MIMES.includes(file.mimetype) && ALLOWED_IMAGE_EXTS.includes(ext);

  const isCertificatePdf =
    file.fieldname === "ownerShopCertificate" &&
    file.mimetype === "application/pdf" &&
    ext === ".pdf";

  if (isImage || isCertificatePdf) {
    return cb(null, true);
  }

  return cb(
    new Error("Only image files (jpg, jpeg, png, gif, webp) are allowed"),
    false
  );
};

const uploadBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const subFolder = getSubFolder(file.fieldname);
    const resourceType = file.mimetype === "application/pdf" ? "raw" : "image";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `elitesaloon/${subFolder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

const createMulterInstance = () =>
  multer({
    storage: isCloudinaryConfigured() ? multer.memoryStorage() : diskStorage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB per file
    },
  });

/**
 * Runs Multer middleware and, when Cloudinary is configured, streams uploaded
 * buffers to Cloudinary and populates `file.filename` and `file.path` with the secure URL.
 */
const wrapUploadMiddleware = (multerMethodName, ...args) => {
  return (req, res, next) => {
    const uploadMiddleware = createMulterInstance()[multerMethodName](...args);

    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed",
        });
      }

      if (!isCloudinaryConfigured()) {
        return next();
      }

      try {
        if (req.file) {
          const result = await uploadBufferToCloudinary(req.file);
          req.file.filename = result.secure_url;
          req.file.path = result.secure_url;
        }

        if (Array.isArray(req.files)) {
          await Promise.all(
            req.files.map(async (file) => {
              const result = await uploadBufferToCloudinary(file);
              file.filename = result.secure_url;
              file.path = result.secure_url;
            })
          );
        } else if (req.files && typeof req.files === "object") {
          const allFiles = Object.values(req.files).flat();
          await Promise.all(
            allFiles.map(async (file) => {
              const result = await uploadBufferToCloudinary(file);
              file.filename = result.secure_url;
              file.path = result.secure_url;
            })
          );
        }

        return next();
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to cloud storage",
        });
      }
    });
  };
};

module.exports = {
  single: (fieldName) => wrapUploadMiddleware("single", fieldName),
  array: (fieldName, maxCount) => wrapUploadMiddleware("array", fieldName, maxCount),
  fields: (fieldsConfig) => wrapUploadMiddleware("fields", fieldsConfig),
};
