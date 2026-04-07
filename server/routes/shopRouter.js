import express from "express";
import isAuth from "../middleware/isAuth.js";
import { createShop, updateShop } from "../controller/shopController.js";

const router = express.Router();

router.post("create-shop", isAuth, createShop);
router.post("update-shop", isAuth, updateShop);

export default router;
