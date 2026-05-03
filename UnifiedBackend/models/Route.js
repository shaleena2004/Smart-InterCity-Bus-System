const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    routeName: { type: String, required: true },
    routeNumber: { type: String },
    startLocation: { type: String },
    endLocation: { type: String },
    distance: { type: String },
    departureTime: { type: String },
    arrivalTime: { type: String },
    date: { type: String },
    busNumber: { type: String },
    status: { type: String, default: 'On Time' },
    ticketPrice: { type: Number },
    stops: [{
        name: { type: String },
        time: { type: String }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
