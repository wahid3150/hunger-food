import Item from "../models/itemModel.js";
import Shop from "../models/shopModel.js";
import {
  deleteMediaFromCloudinary,
  uploadMediaToCloudinary,
} from "../utils/cloudinaryService.js";

export const createItem = async (req, res) => {
  try {
    const { shopId } = req.params;

    const { name, price, category, foodType, isAvailable } = req.body;

    // 1. Validate input
    if (!name || !price || !category || !foodType) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // 2. Validate file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Item image is required",
      });
    }

    if (!req.file.mimetype.startsWith("image")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    // 3. Check shop
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // 4. Ownership check
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add items to this shop",
      });
    }

    // 5. Upload image
    const imageData = await uploadMediaToCloudinary(req.file.path, "items");

    // 6. Create item
    const item = await Item.create({
      name,
      price,
      category,
      foodType,
      shop: shopId,
      owner: req.user._id,
      image: imageData.url,
      imagePublicId: imageData.public_id,
      isAvailable: isAvailable !== undefined ? isAvailable : true, // ✅ optional
    });

    return res.status(201).json({
      success: true,
      message: "Item created successfully",
      item,
    });
  } catch (error) {
    // Handle duplicate item in same shop
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Item already exists in this shop",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
