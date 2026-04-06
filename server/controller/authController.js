import User from "../models/userModels.js";

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
};
