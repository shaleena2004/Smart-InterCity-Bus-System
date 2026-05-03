const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Enable Mongoose Debugging
mongoose.set('debug', true);

// =====================
// Explicit Route Mounting
// =====================
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const routeRoutes = require('./routes/routeRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const busRoutes = require('./routes/busRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const commissionRoutes = require('./routes/commissionRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const revenueAllocationRoutes = require('./routes/revenueAllocationRoutes');

app.use('/api/user', userRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/revenue-allocation', revenueAllocationRoutes);

app.get("/", (req, res) => {
    res.send("Unified Book & Go API is running 🚀");
});

// =====================
// Seed Default Admin + Staff Accounts
// =====================
const User = require('./models/User');

const seedDefaultUsers = async () => {
    const defaultUsers = [
        { name: 'Admin', phone: '770000001', password: 'admin123', role: 'admin', username: 'admin' },
        { name: 'Staff', phone: '770000002', password: 'staff123', role: 'staff', username: 'staff' },
        { name: 'Finance', phone: '770000003', password: 'finance123', role: 'finance', username: 'finance' },
        { name: 'Supplier Manager', phone: '770000004', password: 'supplier123', role: 'supplier', username: 'supplier' },
        { name: 'Demo Driver', phone: '771234567', password: 'driver123', role: 'driver', username: 'driver' },
        { name: 'Demo Passenger', phone: '779876543', password: 'pass123', role: 'passenger', username: 'passenger' },
    ];

    for (const u of defaultUsers) {
        try {
            const exists = await User.findOne({ $or: [{ phone: u.phone }, { username: u.username }] });
            if (!exists) {
                await new User(u).save();
                console.log(`  ✅ Seeded ${u.role}: ${u.name} (phone: ${u.phone})`);
            }
        } catch (e) {
            // ignore duplicate key errors
        }
    }
};

// =====================
// Seed Sample Routes
// =====================
const Route = require('./models/Route');

const seedSampleRoutes = async () => {
    const count = await Route.countDocuments();
    if (count > 0) return;

    const sampleRoutes = [
        { routeName: 'EX1-10', startLocation: 'Colombo', endLocation: 'Kandy', distance: '115 km', departureTime: '06:30 AM', arrivalTime: '10:00 AM', date: '2026-05-02', busNumber: 'NC-4521', status: 'Active' },
        { routeName: 'EX2-15', startLocation: 'Colombo', endLocation: 'Galle', distance: '126 km', departureTime: '08:00 AM', arrivalTime: '11:00 AM', date: '2026-05-02', busNumber: 'NB-9988', status: 'Active' },
        { routeName: 'EX3-20', startLocation: 'Negombo', endLocation: 'Kaduwela', distance: '45 km', departureTime: '07:00 AM', arrivalTime: '09:00 AM', date: '2026-05-02', busNumber: 'ND-1122', status: 'Active' },
        { routeName: 'EX4-25', startLocation: 'Kandy', endLocation: 'Badulla', distance: '120 km', departureTime: '10:30 AM', arrivalTime: '02:30 PM', date: '2026-05-02', busNumber: 'NE-3344', status: 'Active' },
        { routeName: 'EX5-30', startLocation: 'Colombo', endLocation: 'Matara', distance: '160 km', departureTime: '09:00 AM', arrivalTime: '01:30 PM', date: '2026-05-02', busNumber: 'NF-5566', status: 'Active' },
        { routeName: 'EX6-35', startLocation: 'Jaffna', endLocation: 'Colombo', distance: '396 km', departureTime: '05:00 AM', arrivalTime: '01:00 PM', date: '2026-05-02', busNumber: 'NG-7788', status: 'Active' },
    ];

    for (const r of sampleRoutes) {
        await new Route(r).save();
    }
    console.log('  ✅ Seeded sample routes');
};

// =====================
// Seed Sample Suppliers
// =====================
const Supplier = require('./models/Supplier');

const seedSampleSuppliers = async () => {
    const count = await Supplier.countDocuments();
    if (count > 0) return;

    const suppliers = [
        { name: 'Sunil Transport', companyName: 'Sunil & Sons', email: 'sunil@mail.com', phone: '0771234567', status: 'active' },
        { name: 'Kamal Logistics', companyName: 'KL Travels', email: 'kamal@mail.com', phone: '0779876543', status: 'active' },
        { name: 'Perera Motors', companyName: 'PM Bus Service', email: 'perera@mail.com', phone: '0771112233', status: 'active' },
    ];

    for (const s of suppliers) {
        await new Supplier(s).save();
    }
    console.log('  ✅ Seeded sample suppliers');
};

// =====================
// Seed Sample Revenue/Salary/Commission
// =====================
const Revenue = require('./models/Revenue');
const Salary = require('./models/Salary');
const Commission = require('./models/Commission');

const seedFinancialData = async () => {
    const count = await Revenue.countDocuments();
    if (count > 0) return;

    await Revenue.insertMany([
        { ticketSales: 450000, source: 'Route EX1-10 Tickets', description: 'Colombo-Kandy April revenue' },
        { ticketSales: 380000, source: 'Route EX2-15 Tickets', description: 'Colombo-Galle April revenue' },
        { ticketSales: 520000, source: 'Express Service', description: 'Premium routes' },
    ]);

    await Salary.insertMany([
        { staffName: 'Mr. Sunil Perera', role: 'Driver', amount: 85000 },
        { staffName: 'Kamal Silva', role: 'Conductor', amount: 65000 },
        { staffName: 'Nimal Fernando', role: 'Manager', amount: 120000 },
    ]);

    await Commission.insertMany([
        { busCompany: 'Sunil & Sons (NC-4521)', amount: 54000, description: '12% commission' },
        { busCompany: 'KL Travels (NB-9988)', amount: 38000, description: '10% commission' },
    ]);

    console.log('  ✅ Seeded sample financial data');
};

// =====================
// Seed Sample Incidents
// =====================
const Incident = require('./models/Incident');

const seedSampleIncidents = async () => {
    const count = await Incident.countDocuments();
    if (count > 0) return;

    await Incident.create({
        type: 'breakdown',
        severity: 'high',
        description: 'Engine overheating near Colombo Interchange',
        status: 'open',
        date: new Date()
    });

    console.log('  ✅ Seeded sample incident');
};

// =====================
// MongoDB Connection
// =====================
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb+srv://shaleenasamadhushi7_db_user:w0s1wwlLYVFlcq1u@cluster0.fblkiux.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log("MongoDB Connected ❤️  ✅");
        console.log("Seeding default data...");
        await seedDefaultUsers();
        await seedSampleRoutes();
        await seedSampleSuppliers();
        await seedFinancialData();
        await seedSampleIncidents();
        console.log("Seed complete ✅");

        app.listen(PORT, () => {
            console.log(`Unified Server running on port ${PORT} 🚀`);
        });
    })
    .catch(err => {
        console.log("Database connection failed 💔 ❌", err);
    });
