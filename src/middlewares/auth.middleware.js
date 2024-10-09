import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // in place of "res" we use "_" as if "res" is not used
  //in  this function this is a production grade code as follows in industry
  try {
    const token = await (req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""));
    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    } else {
      req.user = user;
      next();
    }
  } catch (error) {
    throw new ApiError(401, "Invalid Access Token");
  }
});
