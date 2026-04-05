import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      minlength: 3,
      maxlength: 30,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: true,
    },
    password: {
      type: String,
      required() {
        return this.provider === "local";
      },
    },
    mobile: {
      type: String,
      required() {
        return this.provider === "local";
      },
    },
    role: {
      type: String,
      enum: ["user", "owner", "deliveryBoy"],
      required: true,
    },
    resetOtp: {
      type: String,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    otpExpires: {
      type: Date,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
