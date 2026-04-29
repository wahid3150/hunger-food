import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  acceptOrder,
  createOrder,
  getAvailableOrders,
  getMyDeliveryOrders,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
} from "../controller/orderController.js";

const router = express.Router();

router.post("/", isAuth, createOrder);
router.get("/my-orders", isAuth, getMyOrders);
router.get("/shop/:shopId", isAuth, getShopOrders);
router.patch("/:orderId/status", isAuth, updateOrderStatus);
router.get("/delivery/available-orders", isAuth, getAvailableOrders);
router.patch("/:orderId/accept", isAuth, acceptOrder);
router.get("/delivery/my-orders", isAuth, getMyDeliveryOrders);

export default router;
