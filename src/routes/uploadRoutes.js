import { Router } from "express";
import uploadController from "../controllers/uploadController.js";

const router = Router();

// POST /api/uploads/upload
router.post(
  "/upload",
  uploadController.uploadMiddleware,
  uploadController.uploadFile
);

export default router;
