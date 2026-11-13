const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const http = require("http");
require("dotenv").config();

// Database connection
const connectDB = require("./config/database");

// Food API routes
const foodRoutes = require("./routes/foodRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Initialize Express
const app = express();

app.set("trust proxy", 1);

const server = http.createServer(app);

// Security middleware
app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

// Request middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use("/api", limiter);

// API homepage
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to FoodExpress API",
        version: "1.0.0"
    });
});

// API health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "Server is running",
        database: "Connected",
        timestamp: new Date()
    });
});

// Food API
app.use("/api/foods", foodRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Start server after MongoDB connection
const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log("------------------------------------");
            console.log("       FOODEXPRESS API SERVER       ");
            console.log("------------------------------------");
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`Health: http://localhost:${PORT}/api/health`);
            console.log(`Foods: http://localhost:${PORT}/api/foods`);
            console.log("Database: Connected");
            console.log("Environment:", process.env.NODE_ENV || "development");
            console.log("------------------------------------");
        });

    } catch (error) {
        console.error("Failed to start FoodExpress:", error.message);
        process.exit(1);
    }
};

// Start application
startServer();

// Export app and server
module.exports = { app, server };