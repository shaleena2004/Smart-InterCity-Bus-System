const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    // Added busId so the trip is linked to a specific bus
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
    },
    status: {
        type: String,
        // Changed to match the Controller logic (Uppercase)
        enum: ['ON_TIME', 'LATE', 'CANCELLED'],
        default: 'ON_TIME'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Trip", tripSchema);