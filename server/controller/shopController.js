import Item from "../models/itemModel.js";
import Shop from "../models/shopModel.js";
import {
  deleteMediaFromCloudinary,
  uploadMediaToCloudinary,
} from "../utils/cloudinaryService.js";

export const createShop = async (req, res) => {
  try {
    const { name, city, state, address } = req.body;
    if (!name || !city || !state || !address) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Shop image is required",
      });
    }

    if (!req.file.mimetype.startsWith("image")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const existingShop = await Shop.findOne({
      name,
      owner: req.user._id, //Prevents duplicates & Allows different user to use same name like A → Burger House User B → Burger House
    });

    if (existingShop) {
      return res.status(409).json({
        success: false,
        message: "Shop with this name already exists",
      });
    }

    // upload image to Cloudinary
    const imageData = await uploadMediaToCloudinary(req.file.path, "shops");
    const shop = await Shop.create({
      name,
      city,
      state,
      address,
      owner: req.user._id,
      image: imageData.url,
      imagePublicId: imageData.public_id,
    });
    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { name, city, state, address } = req.body;

    //find shop
    const shop = await Shop.findById(shopId);
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
        message: "Not authorized to update this shop",
      });
    }

    // duplicate name check (only if name changes)
    if (name && name !== shop.name) {
      const existingShop = await Shop.findOne({
        name,
        owner: req.user._id,
        _id: { $ne: shop._id }, // exclude current shop
      });

      if (existingShop) {
        return res.status(409).json({
          success: false,
          message: "Shop with this name already exists",
        });
      }
    }

    //update fields only if provided
    if (name) shop.name = name;
    if (city) shop.city = city;
    if (state) shop.state = state;
    if (address) shop.address = address;

    if (req.file) {
      if (!req.file.mimetype.startsWith("image")) {
        return res.status(400).json({
          success: false,
          message: "only image files are allowed",
        });
      }
      // delete old image
      if (shop.imagePublicId) {
        await deleteMediaFromCloudinary(shop.imagePublicId);
      }

      // upload new image
      const imageData = await uploadMediaToCloudinary(req.file.path, "shops");
      shop.image = imageData.url;
      shop.imagePublicId = imageData.public_id;
    }

    await shop.save();
    res.status(200).json({
      success: true,
      message: "Shop updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyShop = async (req, res) => {
  try {
    const userId = req.user._id;
    const shops = await Shop.find({ owner: userId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: shops.length,
      shops,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteShop = async (req, res) => {
  try {
    const { shopId } = req.params;

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
        message: "Not authorized to delete shop",
      });
    }

    if (shop.imagePublicId) {
      await deleteMediaFromCloudinary(shop.imagePublicId);
    }

    await shop.deleteOne();
    res.status(200).json({
      success: true,
      message: "Shop deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getShop = async (req, res) => {
  try {
    const { city, search, page = 1, limit = 10 } = req.query;

    let filter = {};

    if (city) {
      filter.city = city;
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const shops = await Shop.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Shop.countDocuments(filter);

    res.status(200).json({
      success: true,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalShops: total,
      shops,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // find item of this shop
    const items = await Item.find({ shop: shopId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      shop,
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
