import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createShop,
  getMyShop,
  getShop,
  getSingleShop,
  updateShop,
} from "../controller/shopController.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.post("/create-shop", isAuth, upload.single("image"), createShop);
router.put("/update-shop/:shopId", isAuth, upload.single("image"), updateShop);
router.get("/my-shops", isAuth, getMyShop);
router.delete("/delete-shop/:shopId", isAuth, deleteShop);
router.get("/shops", getShop);
router.get("/shops/:shopId", getSingleShop);

export default router;
