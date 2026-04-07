import cloudinary from "../config/cloudinaryConfig.js";
import fs from "fs/promises";

export const uploadMediaToCloudinary = async (
  filePath,
  folder = "hunger-food-app",
) => {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    // delete temp file after upload
    await fs.unlink(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    // ensure cleanup even if upload fails
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch {}
    }

    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};
