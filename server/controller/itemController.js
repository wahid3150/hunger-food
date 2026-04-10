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

    if (!name || !price || !category || !foodType) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

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

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add items to this shop",
      });
    }

    const imageData = await uploadMediaToCloudinary(req.file.path, "items");

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

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this item",
      });
    }

    if (req.file) {
      if (!req.file.mimetype.startsWith("image")) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed",
        });
      }

      if (item.imagePublicId) {
        await deleteMediaFromCloudinary(item.imagePublicId);
      }

      const imageData = await uploadMediaToCloudinary(req.file.path, "items");

      item.image = imageData.url;
      item.imagePublicId = imageData.public_id;
    }

    if (name !== undefined) item.name = name.toLowerCase().trim();
    if (price !== undefined) item.price = price;
    if (category !== undefined) item.category = category;
    if (foodType !== undefined) item.foodType = foodType;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    // Handle duplicate name (unique index)
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

// Find item → Check ownership → Delete image → Delete item → Respond
export const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this item",
      });
    }

    if (item.imagePublicId) {
      try {
        await deleteMediaFromCloudinary(item.imagePublicId);
      } catch (err) {
        console.error("Cloudinary delete failed:", err.message);
      }
    }

    await item.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleItemAvailability = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    item.isAvailable = !item.isAvailable;

    await item.save();

    return res.status(200).json({
      success: true,
      message: `Item is now ${item.isAvailable ? "available" : "unavailable"}`,
      item,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyItems = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      search,
      category,
      foodType,
      isAvailable,
      sort,
      shopId,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      owner: userId,
    };

    if (shopId) {
      const shop = await Shop.findById(shopId);

      if (!shop) {
        return res.status(404).json({
          success: false,
          message: "Shop not found",
        });
      }

      if (shop.owner.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this shop",
        });
      }

      filter.shop = shopId;
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    if (foodType) {
      filter.foodType = foodType;
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const items = await Item.find(filter)
      .populate("shop", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalItems = await Item.countDocuments(filter);

    return res.status(200).json({
      success: true,
      totalItems,
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getItemsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    const {
      search,
      category,
      foodType,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      shop: shopId,
      isAvailable: true, // public only sees available items
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    if (foodType) {
      filter.foodType = foodType;
    }

    let sortOption = { createdAt: -1 }; // default latest

    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const items = await Item.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const totalItems = await Item.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: items.length,
      totalItems,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / limit),
      items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findOne({
      _id: itemId,
      isAvailable: true,
    }).populate("shop", "name image");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or not available",
      });
    }

    return res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const {
      search,
      category,
      foodType,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      isAvailable: true,
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    if (foodType) {
      filter.foodType = foodType;
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };

    const skip = (page - 1) * limit;

    const items = await Item.find(filter)
      .populate("shop", "name image")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const totalItems = await Item.countDocuments(filter);

    return res.status(200).json({
      success: true,
      totalItems,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / limit),
      items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
