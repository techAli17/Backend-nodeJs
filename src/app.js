import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./utils/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//imports routes

import userRouter from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter);

// Global error handler
app.use(errorHandler); // This should be after all the routes

export default app;
