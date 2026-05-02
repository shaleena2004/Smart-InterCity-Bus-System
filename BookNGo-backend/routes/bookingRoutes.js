const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Create a booking
router.post('/', async (req, res) => {
    try {
        const { user, busRoute, seatNumber, date } = req.body;
        const booking = new Booking({ user, busRoute, seatNumber, date });
        await booking.save();
        res.status(201).json({ message: 'Booking created', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user', 'name email');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
