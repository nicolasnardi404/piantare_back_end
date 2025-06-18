import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const setupStorage = async () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error(
      "Missing Supabase configuration. Please check your .env file."
    );
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const plantsBucket = buckets.find((b) => b.name === "plants");

    if (!plantsBucket) {
      // Create the bucket if it doesn't exist
      const { data, error: createError } = await supabase.storage.createBucket(
        "plants",
        {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ["image/*"],
        }
      );

      if (createError) {
        throw createError;
      }

      console.log('Created "plants" bucket successfully');
    } else {
      console.log('"plants" bucket already exists');
    }

    // Update bucket to be public
    const { error: updateError } = await supabase.storage.updateBucket(
      "plants",
      {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/*"],
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log("Storage setup completed successfully");
  } catch (error) {
    console.error("Error setting up storage:", error);
    process.exit(1);
  }
};

setupStorage();
