import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class UploadService {
  async uploadFile(file) {
    try {
      // Log the file details
      console.log("File details:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer ? "Present" : "Missing",
      });

      // Generate a unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = path.extname(file.originalname);
      const fileName = `${timestamp}-${randomString}${extension}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("plants")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: "3600",
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }

      console.log("Upload successful:", data);

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("plants").getPublicUrl(fileName);

      return {
        success: true,
        fileName: fileName,
        url: publicUrl,
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async getFileUrl(fileName, userId) {
    try {
      if (!fileName.startsWith(`user_${userId}/`)) {
        throw new Error("Unauthorized access to file");
      }

      // Create a new signed URL
      const {
        data: { signedUrl },
        error,
      } = await supabase.storage
        .from("plants-private")
        .createSignedUrl(fileName, 3600);

      if (error) {
        throw error;
      }

      return {
        success: true,
        url: signedUrl,
        expiresIn: "1 hour",
      };
    } catch (error) {
      console.error("Error getting file URL:", error);
      throw new Error(`Failed to get file URL: ${error.message}`);
    }
  }
}

export default new UploadService();
