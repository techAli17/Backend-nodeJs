import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudDb = async (file) => {
  try {
    if (!file) {
      throw new Error("File not found");
    }
    const uploadResult = await cloudinary.uploader.upload(file, {
      public_id: "db_" + Date.now(),
      resource_type: "auto",
    });
    console.log(uploadResult.url, "++++uploadResult");

    return uploadResult;
  } catch (error) {
    console.log(error, " error in uploadOnCloudDb");
    fs.unlinkSync(file); // remove the locally uploaded file
    return null;
  }
};

export default uploadOnCloudDb;
