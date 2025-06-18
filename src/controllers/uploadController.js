import multer from "multer";
import uploadService from "../services/uploadService.js";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

class UploadController {
  constructor() {
    // Bind methods to ensure proper 'this' context
    this.uploadFile = this.uploadFile.bind(this);
    this.uploadMiddleware = upload.single("file");
  }

  // Handler for file upload
  async uploadFile(req, res) {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
        });
      }

      // Log the incoming file
      console.log("Received file:", {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      });

      // Upload to Supabase Storage
      const result = await uploadService.uploadFile(req.file);

      // Return success response with file URL
      res.json(result);
    } catch (error) {
      console.error("Upload controller error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload file",
      });
    }
  }
}

export default new UploadController();
