import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      min: 3,
      max: 30,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please provide a valid email address"],
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
      match: [/^\+?\d{10,13}$/, "Please provide a valid phone number"],
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
