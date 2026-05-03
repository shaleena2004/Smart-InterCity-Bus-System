const mongoose = require('mongoose');
const User = require('../models/User');
const Route = require('../models/Route');
const Revenue = require('../models/Revenue');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = "mongodb+srv://shaleenasamadhushi7_db_user:w0s1wwlLYVFlcq1u@cluster0.fblkiux.mongodb.net/?appName=Cluster0";

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing data
        await User.deleteMany({});
        await Route.deleteMany({});
        await Revenue.deleteMany({});

        // Seed Users
        const users = await User.insertMany([
            { name: 'Admin', email: 'admin@bookngo.com', password: 'password123', phone: '771111111', role: 'admin' },
            { name: 'Sunil Driver', email: 'sunil@driver.com', password: 'password123', phone: '772222222', role: 'driver' },
            { name: 'Kamal Passenger', email: 'kamal@gmail.com', password: 'password123', phone: '773333333', role: 'passenger' }
        ]);
        console.log("Users seeded ✅");

        // Seed Routes
        await Route.insertMany([
            { routeName: '138 - Pettah', startLocation: 'Maharagama', endLocation: 'Colombo Fort', fare: 150, status: 'ACTIVE', estimatedArrival: '5 mins' },
            { routeName: '120 - Pettah', startLocation: 'Horana', endLocation: 'Pettah', fare: 200, status: 'ACTIVE', estimatedArrival: '12 mins' },
            { routeName: 'EX1-10 - Expressway', startLocation: 'Negombo', endLocation: 'Kaduwela', fare: 500, status: 'IN-TRANSIT', estimatedArrival: '15 mins' }
        ]);
        console.log("Routes seeded ✅");

        // Seed Revenue
        await Revenue.insertMany([
            { ticketSales: 450000, date: new Date(), source: 'Tickets' },
            { ticketSales: 12500, date: new Date(), source: 'Booking Fees' }
        ]);
        console.log("Revenue seeded ✅");

        console.log("Seeding complete! 🚀");
        process.exit();
    } catch (err) {
        console.error("Seeding failed ❌", err);
        process.exit(1);
    }
};

seedData();
