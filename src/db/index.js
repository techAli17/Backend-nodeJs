import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(`Connected to database: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log(error, "Error in connecting to database");
    process.exit(1);
  }
};

export default connectDB;
