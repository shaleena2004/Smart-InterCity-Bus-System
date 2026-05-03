const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Support both linked-user bookings and guest bookings
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    id: { type: String },  // legacy id field from bookings app
    busRoute: { type: String, required: true },
    route: { type: String },  // alias used in bookings app
    seatNumber: { type: String, required: true },
    seat: { type: String },   // alias used in bookings app
    date: { type: String, required: true },
    time: { type: String },
    status: { type: String, default: 'Pending' },
    busType: { type: String, default: 'Single Deck' },
    busNumber: { type: String },
    name: { type: String },
    contact: { type: String },
    fare: { type: Number, default: 0 },
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
