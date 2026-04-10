import express from "express";
import isAuth from "../middleware/isAuth.js";
import { createItem } from "../controller/itemController.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.post("/shops/:shopId/items", isAuth, upload.single("image"), createItem);
export default router;
