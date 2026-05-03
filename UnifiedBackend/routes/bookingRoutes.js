const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Revenue = require('../models/Revenue');

// Create a booking
router.post('/', async (req, res) => {
    try {
        const { user, busRoute, seatNumber, date, name, contact, busNumber, fare, time, busType } = req.body;
        const booking = new Booking({
            user,
            busRoute: busRoute || req.body.route,
            seatNumber: seatNumber || req.body.seat,
            date,
            name,
            contact,
            busNumber,
            fare,
            time,
            busType,
            status: 'Confirmed'
        });
        await booking.save();

        if (booking.status === 'Confirmed') {
            const revenue = new Revenue({
                ticketSales: fare,
                source: `Booking: ${busRoute}`,
                description: `Ticket for Seat(s) ${seatNumber}`,
                date: new Date()
            });
            await revenue.save();
        }

        res.status(201).json({ message: 'Booking created', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get bookings for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user', 'name phone').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update booking status (confirm, cancel, etc.)
router.patch('/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Cancel a booking
router.patch('/:id/cancel', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: 'Cancelled' },
            { new: true }
        );
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Booking cancelled', booking });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a booking
router.delete('/:id', async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: 'Booking deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
