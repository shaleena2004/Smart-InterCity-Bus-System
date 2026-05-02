const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected ❤️  ✅");

        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port🤩 ${process.env.PORT || 5000}🌚`);
        });
    })
    .catch(err => {
        console.log("Database connection failed 💔 ❌", err);
    });