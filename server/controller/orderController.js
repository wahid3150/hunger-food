import Item from "../models/itemModel.js";
import Order from "../models/orderModel.js";
import Shop from "../models/shopModel.js";

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod,
      note,
      customerName,
      customerPhone,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items provided",
      });
    }

    if (!deliveryAddress?.text || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Delivery address and payment method required",
      });
    }

    //1. fetch items from DB
    const itemIds = items.map((i) => i.itemId);

    const dbItems = await Item.find({ _id: { $in: itemIds } });

    // validation: all items exist
    if (dbItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "Some items not found",
      });
    }

    //2. group item by shop
    const shopMap = {};
    for (const cartItem of items) {
      const dbItem = dbItems.find((i) => i._id.toString() === cartItem.itemId);

      //validate availability
      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${dbItem.name} is not available`,
        });
      }

      const shopId = dbItem.shop.toString();
      if (!shopMap[shopId]) {
        shopMap[shopId] = [];
      }
      shopMap[shopId].push({
        item: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: Number(cartItem.quantity || 1),
      });
    }

    //3. create orders per shop
    const createdOrders = [];
    for (const shopId in shopMap) {
      const orderItems = shopMap[shopId];

      const totalAmount = orderItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );

      const order = await Order.create({
        user: req.user._id,
        shop: shopId,
        items: orderItems,
        totalAmount,
        deliveryAddress,
        paymentMethod,
        note,
        customerName,
        customerPhone,
      });
      createdOrders.push(order);
    }
    res.status(201).json({
      success: true,
      message: "Orders created successfully",
      orders: createdOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .populate("shop", "name image city state address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getShopOrders = async (req, res) => {
  try {
    const { shopId } = req.params;

    //check shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // ownership check
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these orders",
      });
    }

    //get orders of this shop
    const orders = await Order.find({ shop: shopId })
      .populate("user", "fullName email mobile")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    //validate input
    if (!status) {
      return res.status(400).json({
        success: false,
        messsage: "Status is required",
      });
    }

    //find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    //find shop
    const shop = await Shop.findById(order.shop);
    //ownership check
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this order",
      });
    }

    // status flow control
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["out_for_delivery"],
      out_for_delivery: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const currentStatus = order.status;
    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    //update status
    order.status = status;

    //handle COD payment on delivery
    if (status === "delivered" && order.paymentMethod === "cod") {
      order.isPaid = true;
    }

    await order.save();
    res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
