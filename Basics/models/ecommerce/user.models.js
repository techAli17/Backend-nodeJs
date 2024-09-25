import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
      min: [10, "Phone number should be 10 digits"],
      max: [10, "Phone number should be 10 digits"],
    },
    password: {
      type: String,
      required: true,
      min: [6, "Password should be at least 6 characters"],
      max: [12, "Password should be at most 20 characters"],
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
