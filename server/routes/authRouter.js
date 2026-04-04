import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controller/userController.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/signin", loginUser);
router.post("/logout", logoutUser);

export default router;
