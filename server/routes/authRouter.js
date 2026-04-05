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
import validateBody from "../middleware/validate.js";
import signupSchema from "../validator/signupSchema.js";
import loginSchema from "../validator/loginSchema.js";
import { sendOtpSchema } from "../validator/sendOtpSchema.js";
import { verifyOtpSchema } from "../validator/verifyOtpSchema.js";
import { resetPasswordSchema } from "../validator/resetPasswordSchema.js";
import googleAuthSchema from "../validator/googleAuthSchema.js";

const router = express.Router();

router.post("/signup", validateBody(signupSchema), registerUser);
router.post("/signin", validateBody(loginSchema), loginUser);
router.post("/logout", logoutUser);
router.post("/send-otp", validateBody(sendOtpSchema), sendOtp);
router.post("/verify-otp", validateBody(verifyOtpSchema), verifyOtp);
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  resetPassword,
);
router.post("/google-auth", validateBody(googleAuthSchema), googleAuth);

export default router;
