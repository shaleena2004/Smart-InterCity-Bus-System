const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    busRoute: { type: String, required: true },
    seatNumber: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, default: 'Pending' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
