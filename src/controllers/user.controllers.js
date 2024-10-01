import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import uploadOnCloudDb from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  if (!username || !email || !password || !fullName) {
    throw new ApiError(400, "All fields are required");
  }

  const userExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExists) {
    throw new ApiError(409, "User already exists with same username or email");
  }

  const avatarLocalPath = req?.files?.avatar[0]?.path;
  const coverImageLocalPath = req?.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image are required");
  }

  const avatarUrl = await uploadOnCloudDb(avatarLocalPath);
  const coverImageUrl = await uploadOnCloudDb(coverImageLocalPath);

  if (!avatarUrl || !coverImageUrl) {
    throw new ApiError(400, "Failed to upload image");
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
      .json(new ApiResponse(200, newUser, "User created successfully"));
  } else {
    throw new ApiError(500, "Failed to create user while registration");
  }
});

export { registerUser };
