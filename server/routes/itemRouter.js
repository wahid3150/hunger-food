import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createItem,
  deleteItem,
  getAllItems,
  getItemsByShop,
  getMyItems,
  getSingleItem,
  toggleItemAvailability,
  updateItem,
} from "../controller/itemController.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

// Protected routes
router.post("/shops/:shopId/items", isAuth, upload.single("image"), createItem);
router.put("/items/:itemId", isAuth, upload.single("image"), updateItem);
router.delete("/items/:itemId", isAuth, deleteItem);
router.patch(
  "/items/:itemId/toggle-availability",
  isAuth,
  toggleItemAvailability,
);
router.get("/my-items", isAuth, getMyItems);

// Public routes
router.get("/shops/:shopId/items", getItemsByShop);
router.get("/items/:itemId", getSingleItem);
router.get("/items", getAllItems);

export default router;
