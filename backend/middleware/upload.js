const multer = require("multer");
const path = require("path");

/** Default 50MB — large spreadsheets / many rows exceed 10MB easily. Override with MAX_UPLOAD_MB in .env */
const maxMb = Math.min(
  200,
  Math.max(1, parseInt(process.env.MAX_UPLOAD_MB || "50", 10) || 50)
);
const maxBytes = maxMb * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowed = [".xlsx", ".xls", ".csv"];
  if (!allowed.includes(ext)) {
    cb(new Error("Only .xlsx, .xls, and .csv files are allowed"));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxBytes },
});

module.exports = {
  uploadMiddleware: upload.single("file"),
  maxUploadMb: maxMb,
};
