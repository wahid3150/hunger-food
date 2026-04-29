import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    // Who place order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // which shop recieves this order
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },

    // items inside this order
    items: {
      type: [orderItemSchema],
      validate: [(val) => val.length > 0, "Order must have items"],
    },

    // total for this shop only
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryAddress: {
      text: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "pending", // created
        "confirmed", // owner accepted
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // 🧾 optional notes
    note: {
      type: String,
    },
    deliveryStatus: {
      type: String,
      enum: ["not_assigned", "assigned", "picked", "on_the_way", "delivered"],
      default: "not_assigned",
    },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1 });
orderSchema.index({ shop: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryBoy: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
