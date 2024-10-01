import { ApiError } from "./ApiError.js";

// errorHandler.js

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  const response = new ApiError(statusCode, null, message);
  res.status(statusCode).json(response);
};

export { errorHandler };
