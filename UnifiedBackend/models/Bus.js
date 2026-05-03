const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true
    },
    plateNumber: {
        type: String,
        required: true,
        unique: true
    },
    busType: {
        type: String,
        enum: ["AC", "Non-AC"],
        required: true
    },
    seatCount: {
        type: Number,
        required: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true
    },
    brand: { type: String },
    model: { type: String },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    route: {
        type: String
    },
    amenities: {
        wifi: { type: Boolean, default: false },
        charging: { type: Boolean, default: false },
        ac: { type: Boolean, default: true }
    },
    technicalStatus: {
        engineHealth: { type: Number, default: 100 },
        fuelLevel: { type: Number, default: 100 },
        batteryStatus: { type: String, default: '12.6V' },
        coolantTemp: { type: Number, default: 90 },
        statusDetails: { type: String }
    },
    maintenanceDetails: { type: String },
    maintenanceMileage: { type: Number },
    maintenanceDate: { type: Date },
    operationalDays: [{ type: String }],
    compliance: {
        insuranceCompany: { type: String },
        insurancePolicy: { type: String },
        insuranceExpiry: { type: Date },
        licenseExpiry: { type: Date }
    },
    maintenanceLogs: [{
        issue: { type: String },
        description: { type: String },
        priority: { type: String },
        category: { type: String },
        date: { type: Date, default: Date.now }
    }],
    reminders: [{
        task: { type: String },
        description: { type: String },
        dueDate: { type: Date },
        dueMileage: { type: Number },
        priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
        status: { type: String, enum: ["Pending", "Completed"], default: "Pending" }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Bus || mongoose.model("Bus", busSchema);