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

// Business logic flow
// Find item → Check ownership → Handle image → Update fields → Save
export const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const { name, price, category, foodType, isAvailable } = req.body;

    // 1. Find item
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // 2. Ownership check
    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this item",
      });
    }

    // 3. Handle image replacement
    if (req.file) {
      if (!req.file.mimetype.startsWith("image")) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed",
        });
      }

      // 🔥 delete old image
      if (item.imagePublicId) {
        await deleteMediaFromCloudinary(item.imagePublicId);
      }

      // upload new image
      const imageData = await uploadMediaToCloudinary(req.file.path, "items");

      item.image = imageData.url;
      item.imagePublicId = imageData.public_id;
    }

    // 4. Update only provided fields (partial update)
    if (name !== undefined) item.name = name.toLowerCase().trim();
    if (price !== undefined) item.price = price;
    if (category !== undefined) item.category = category;
    if (foodType !== undefined) item.foodType = foodType;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;

    // 5. Save updated item
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    // 🔥 Handle duplicate name (unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Item with this name already exists in this shop",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
