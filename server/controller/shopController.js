import Shop from "../models/shopModel";
import {
  deleteMediaFromCloudinary,
  uploadMediaToCloudinary,
} from "../utils/cloudinaryService";

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
      if (!req.files.mimetype.startsWith("image")) {
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

// export const editShop = async (req, res) => {
//   const { name, image, city, state, address } = req.body;
//   try {
//     let image;
//     if (req.file) {
//       image = await uploadOnCloudinary(req.file.path);
//     }
//     const updatedShop = await Shop.findByIdAndUpdate(
//       req.params.id,
//       { name, image, city, state, address },
//       { new: true },
//     );
//     return res.status(200).json(updatedShop);
//   } catch (error) {
//     return res
//       .status(500)
//       .json({
//         success: false,
//         message: "Internal server error",
//         error: error.message,
//       });
//   }
// };
