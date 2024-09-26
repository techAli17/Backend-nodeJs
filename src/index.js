// require('dotenv').config() this also works but we need to use dotenv as a package module as import
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB();
