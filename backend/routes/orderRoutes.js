const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Food = require("../models/Food");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST: Place a new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, deliveryAddress, phone } = req.body;

    // Validate input
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      !deliveryAddress?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide food items, delivery address and phone.",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Validate food items and calculate prices on the server
    for (const item of items) {
      const quantity = Number(item.quantity);

      if (
        !mongoose.Types.ObjectId.isValid(item.food) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid food item or quantity.",
        });
      }

      const food = await Food.findById(item.food);

      if (!food || !food.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "One or more food items are unavailable.",
        });
      }

      totalAmount += food.price * quantity;

      orderItems.push({
        food: food._id,
        name: food.name,
        quantity,
        price: food.price,
      });
    }

    // Save order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      deliveryAddress: deliveryAddress.trim(),
      phone: phone.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    console.error("Place order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to place order.",
    });
  }
});

// GET: Get logged-in customer's orders
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.food", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders.",
    });
  }
});

// GET: Get a single order belonging to the logged-in customer
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("items.food", "name image");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve order.",
    });
  }
});

module.exports = router;