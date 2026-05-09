import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedExts = new Set([".pdf", ".docx", ".doc"]);

function safeExtname(name) {
  const lower = name.toLowerCase();
  for (const ext of allowedExts) {
    if (lower.endsWith(ext)) return ext;
  }
  return null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = safeExtname(file.originalname) || ".bin";
    const base = path.basename(file.originalname, ext).replace(/[^\w.-]/g, "_");
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = safeExtname(file.originalname);
  if (!ext) return cb(new Error("Chỉ chấp nhận file PDF, DOCX, hoặc DOC"));
  cb(null, true);
}

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function uploadSingle(name = "file") {
  return (req, res, next) => {
    uploader.single(name)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File vượt quá 10MB" });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  };
}

export function uploadArray(name = "files", maxCount = 5) {
  return (req, res, next) => {
    uploader.array(name, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File vượt quá 10MB" });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  };
}
