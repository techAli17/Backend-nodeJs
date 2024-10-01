import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // File has been uploaded successfully
    console.log("File uploaded successfully to Cloudinary", response.url);
    fs.unlinkSync(localFilePath); // Remove the local file after upload
    return response;
  } catch (error) {
    console.error("Cloudinary upload failed", error); // Log the specific error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Remove the local file if it exists
    }
    return null;
  }
};

export { uploadOnCloudinary };
