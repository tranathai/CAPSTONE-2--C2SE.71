import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMime = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

function allowedExtensions(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".pdf" || ext === ".docx" || ext === ".doc";
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/[^\w.-]/g, "_");
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const okMime = allowedMime.has(file.mimetype);
  const okExt = allowedExtensions(file.originalname);
  if (okMime || okExt) {
    return cb(null, true);
  }
  cb(new Error("Chỉ chấp nhận PDF hoặc DOC/DOCX"));
}

const uploadSubmissionFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

export function submissionUploadMiddleware(req, res, next) {
  uploadSubmissionFile.single("file")(req, res, (err) => {
    if (!err) {
      return next();
    }
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File vượt quá kích thước cho phép (tối đa 20MB)",
      });
    }
    const message =
      err instanceof Error ? err.message : "Lỗi khi nhận file upload";
    return res.status(400).json({ success: false, message });
  });
}

export { uploadSubmissionFile };
