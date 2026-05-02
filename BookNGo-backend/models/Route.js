const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    routeName: { type: String, required: true },
    startLocation: { type: String, required: true },
    endLocation: { type: String, required: true },
    distance: { type: String },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    date: { type: String, required: true },
    busNumber: { type: String },
    status: { type: String, default: 'On Time' },
    stops: [{
        name: { type: String },
        time: { type: String }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
