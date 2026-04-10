import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 30,
      lowercase: true,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "snacks",
        "desserts",
        "pizza",
        "burger",
        "sandwich",
        "wrap",
        "salad",
        "pasta",
        "rice",
        "noodles",
        "chicken",
        "beef",
        "pork",
        "vegetable",
        "fruit",
        "drink",
        "other",
      ],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    foodType: {
      type: String,
      enum: ["veg", "non-veg"],
      required: true,
    },
  },
  { timestamps: true },
);

// Compound index used For query performance
itemSchema.index({ shop: 1, owner: 1 });

// For unique items inside a shop block duplicate item names in the same shop but allow same item names in different shops
itemSchema.index({ shop: 1, name: 1 }, { unique: true });

const Item = mongoose.model("Item", itemSchema);
export default Item;
