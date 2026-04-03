import mongoose from "mongoose";

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI not found in environment variable");
  process.exit(1);
}

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 30000,
    };
    await mongoose.connect(uri, options);
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection error", error);
  }
};

export default connectDB;
