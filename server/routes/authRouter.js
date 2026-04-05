import express from "express";
import {
  googleAuth,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  sendOtp,
  verifyOtp,
} from "../controller/userController.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/signin", loginUser);
router.post("/logout", logoutUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/google-auth", googleAuth);

export default router;
