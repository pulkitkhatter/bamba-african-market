import { Router } from "express";
import multer from "multer";
import { uploadImage } from "../lib/supabaseStorage.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  // Vercel serverless functions cap request bodies around 4.5MB, so stay
  // comfortably under that regardless of host.
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/",
  requireAdmin,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }
      const url = await uploadImage(req.file);
      res.json({ url });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
