import express from "express";
import isAuth from "../middleware/isAuth.js";
import { createShop, updateShop } from "../controller/shopController.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.post("/create-shop", isAuth, upload.single("image"), createShop);
router.put("/update-shop/:shopId", isAuth, upload.single("image"), updateShop);

export default router;
