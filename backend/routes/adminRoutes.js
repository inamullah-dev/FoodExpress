const express = require("express");
const mongoose = require("mongoose");

const Food = require("../models/Food");
const Order = require("../models/Order");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// DASHBOARD STATISTICS
router.get("/stats", async (req, res) => {
  try {
    const totalFoods = await Food.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const deliveredOrders = await Order.countDocuments({ status: "Delivered" });

    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalFoods,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue: revenueResult[0]?.totalRevenue || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics.",
    });
  }
});

// GET ALL FOOD
router.get("/foods", async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });

    res.json({ success: true, count: foods.length, foods });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve food items.",
    });
  }
});

// ADD FOOD
router.post("/foods", async (req, res) => {
  try {
    const { name, description, price, category, image, isAvailable } = req.body;

    if (!name || !description || price === undefined || !category || !image) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required food details.",
      });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid food price.",
      });
    }

    const food = await Food.create({
      name,
      description,
      price: Number(price),
      category,
      image,
      isAvailable: isAvailable ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Food item added successfully.",
      food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to add food item.",
    });
  }
});

// UPDATE FOOD
router.put("/foods/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID.",
      });
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found.",
      });
    }

    res.json({
      success: true,
      message: "Food item updated successfully.",
      food,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update food item.",
    });
  }
});

// DELETE FOOD
router.delete("/foods/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food ID.",
      });
    }

    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found.",
      });
    }

    res.json({
      success: true,
      message: "Food item deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete food item.",
    });
  }
});

// GET ALL ORDERS
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate("items.food", "name image")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve customer orders.",
    });
  }
});

// UPDATE ORDER STATUS
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("user", "name email phone")
      .populate("items.food", "name image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
});

module.exports = router;