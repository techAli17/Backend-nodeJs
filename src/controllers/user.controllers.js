import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password || !fullName) {
      throw new ApiError(400, "All fields are required");
    }

    const userExists = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (userExists) {
      throw new ApiError(
        409,
        "User already exists with same username or email"
      );
    }

    const avatarLocalPath = req?.files?.avatar[0]?.path;
    // const coverImageLocalPath = req?.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (
      req?.files &&
      Array.isArray(req?.files?.coverImage) &&
      req?.files?.coverImage.length > 0
    ) {
      coverImageLocalPath = req?.files?.coverImage[0]?.path;
    }

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar image is required");
    }

    const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
    const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatarUrl) {
      throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
      email,
      password,
      fullName,
      avatar: avatarUrl.url,
      username: username.toLowerCase(),
      coverImage: coverImageUrl?.url || null,
    });

    const newUser = await User.findById(user._id)
      .select("-password -refreshToken")
      .exec();

    if (newUser) {
      res
        .status(201)
        .json(new ApiResponse(201, newUser, "User created successfully"));
    } else {
      throw new ApiError(500, "Failed to create user during registration");
    }
  } catch (error) {
    next(error);
  }
});

export { registerUser };
