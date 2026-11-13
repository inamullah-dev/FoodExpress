const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(userId).select("role");

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to verify administrator privileges.",
    });
  }
};

module.exports = adminMiddleware;