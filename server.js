/* This is my main backend file (brain file 🧠) */

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Supplier = require("./models/Supplier");
const supplierRoutes = require("./routes/supplierRoutes");
const busRoutes = require("./routes/busRoutes");
const performanceRoutes = require("./routes/performanceRoutes")
const revenueAllocationRoutes = require("./routes/revenueAllocationRoutes.js");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/suppliers", supplierRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/performance", require("./routes/performanceRoutes"));
app.use("/api/revenue-allocation", revenueAllocationRoutes);

// Test Route
app.get("/", (req, res) => {
    res.send("Book & Go API is running 🚀");
});


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected ❤️  ✅");

        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port🤩 ${process.env.PORT || 5000}🌚`);
        });
    })
    .catch(err => {
        console.log("Database connection failed 💔 ❌", err);
    });