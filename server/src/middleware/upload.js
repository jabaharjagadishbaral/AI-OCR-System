import multer from "multer";

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 25);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

export default upload;
