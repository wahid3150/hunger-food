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

    // 1. fetch items from DB
    const itemIds = items.map((i) => i.itemId);

    const dbItems = await Item.find({ _id: { $in: itemIds } });

    // validation: all items exist
    if (dbItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "Some items not found",
      });
    }

    // 2. group items by shop
    const shopMap = {};

    for (const cartItem of items) {
      const dbItem = dbItems.find((i) => i._id.toString() === cartItem.itemId);

      // safety check (important fix)
      if (!dbItem) {
        return res.status(400).json({
          success: false,
          message: "Invalid item in cart",
        });
      }

      // validate availability
      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${dbItem.name} is not available`,
        });
      }

      // quantity validation (important fix)
      const quantity = Number(cartItem.quantity || 1);

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity",
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
        quantity,
      });
    }

    // 3. create orders per shop
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
        message: "Status is required",
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
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }
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

    // Check if delivery boy is assigned before changing to out_for_delivery
    if (status === "out_for_delivery") {
      if (!order.deliveryBoy || order.deliveryStatus !== "assigned") {
        return res.status(400).json({
          success: false,
          message:
            "A delivery boy must accept the order before marking it as out for delivery",
        });
      }
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

export const getAvailableOrders = async (req, res) => {
  try {
    if (req.user.role !== "deliveryBoy") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const orders = await Order.find({
      status: { $in: ["confirmed", "preparing"] },
      deliveryStatus: "not_assigned",
    })
      .populate("shop", "name address")
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

export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user._id;
    if (req.user.role !== "deliveryBoy") {
      return res.status(403).json({
        success: false,
        message: "Only delivery boys can accept orders",
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryStatus: "not_assigned",
      },
      {
        deliveryBoy: riderId,
        deliveryStatus: "assigned",
        status: "preparing",
      },
      { new: true },
    );

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyDeliveryOrders = async (req, res) => {
  try {
    if (req.user.role !== "deliveryBoy") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const orders = await Order.find({
      deliveryBoy: req.user._id,
    })
      .populate("shop", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
