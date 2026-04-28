import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createOrder,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
} from "../controller/orderController.js";

const router = express.Router();

router.post("/", isAuth, createOrder);
router.get("/my-orders", isAuth, getMyOrders);
router.post("/my-orders", isAuth, getMyOrders);
router.get("/shop/:shopId", isAuth, getShopOrders);
router.patch("/:orderId/status", isAuth, updateOrderStatus);

export default router;
