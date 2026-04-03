import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB();
  console.log(`server is running on ${PORT}`);
});
