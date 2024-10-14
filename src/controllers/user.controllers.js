import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

//give me login algorithm for user signup step by step
// 1. check if user exists
// 2. check if username or email is already taken
// 2.1 check if username is already taken
// 2.2 check if email is already taken
// 2.3 check if both username and email are already taken
// 3. hash password
// 3.1 if password is hashed
// 3.2 if password is not hashed
// 4. create user
// 5. generate access token
// 6. generate refresh token
// 7. save refresh token in database
// 8. send access token and refresh token

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

//generate access and refresh token
// 1. generate access token
// 2. generate refresh token
// 3. save refresh token in database
// 4. send access token and refresh token

const geneAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate access and refresh token");
  }
};

//refresh access token
// 1. check if refresh token is present
// 2. check if refresh token is valid
// 3. generate access token
// 4. generate refresh token
// 5. save refresh token in database
// 6. send access token and refresh token

const refreshToken = asyncHandler(async (req, res, next) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token not found or unauthorized");
    }

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(decodedToken?._id);

      if (!user) {
        throw new ApiError(401, "Invalid Refresh token");
      }

      if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is used or expired");
      }

      const options = {
        secure: true,
        httpOnly: true,
      };

      const { accessToken, refreshToken } = await geneAccessAndRefreshToken(
        user._id
      );

      if (accessToken && refreshToken) {
        res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(new ApiResponse(200, null, "Access token and refresh token"));
      } else {
        throw new ApiError(500, "Failed to generate access and refresh token");
      }
    } catch (error) {
      throw new ApiError(401, "Invalid Refresh token");
    }
  } catch (error) {
    next(error);
  }
});

//give me login algorithm for user login step by step
// 1. check if user exists
// 1.1 if user exists
// 2. check if password is correct
// 3. generate access token
// 4. generate refresh token
// 4.1 send cookies with refresh token
// 5. save refresh token in database
// 6. send access token and refresh token

const loginUser = asyncHandler(async (req, res, next) => {
  try {
    const { email, password, username } = req.body; // Get user input
    if (!username && !email) {
      throw new ApiError(400, "username or email is required");
    }
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (!user) {
      throw new ApiError(401, "user not found with given credentials");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid Credentials");
    }

    const { accessToken, refreshToken } = await geneAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findById(user._id)
      .select("-password -refreshToken")
      .exec();

    const options = {
      secure: true,
      httpOnly: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

// algorithm for user logout
// 1. clear cookies
// 2. delete refresh token from database

const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    secure: true,
    httpOnly: true,
  };

  try {
    res
      .status(200)
      .cookie("accessToken", options)
      .cookie("refreshToken", options)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  } catch (error) {
    next(error);
  }
});

// change current password
// 1. check if current password is correct
// 2. change password

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid current password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (error) {
    next(error);
  }
});

// update account profile

const updateAccountDetails = asyncHandler(async (req, res, next) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      throw new ApiError(400, "username, email and fullName are required");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          email,
          fullName,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Profile updated successfully"));
  } catch (error) {
    next(error);
  }
});

//get current user details
// 1. get user
// 2. send user

const getCurrentUserDetails = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user?._id).select("-password");
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User details fetched successfully"));
  } catch (error) {
    next(error);
  }
});

// update user avatar

const updateUserAvatar = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const avatarLocalPath = req.file?.path;
    // await user.save({ validateBeforeSave: false });
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
      throw new ApiError(500, "Error while Avatar upload!");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "User avatar updated successfully")
      );
  } catch (error) {
    next(error);
  }
});

// update user cover image
const updateUserCoverImage = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const coverImageLocalPath = req.file?.path;
    // await user.save({ validateBeforeSave: false });
    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover Image is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
      throw new ApiError(500, "Error while Cover Image upload!");
    }

    const userUpdated = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          userUpdated,
          "User cover image updated successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

export {
  loginUser,
  logoutUser,
  registerUser,
  refreshToken,
  updateUserAvatar,
  updateAccountDetails,
  updateUserCoverImage,
  getCurrentUserDetails,
  changeCurrentPassword,
};
