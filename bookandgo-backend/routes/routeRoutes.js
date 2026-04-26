const express = require('express');
const router = express.Router();
const Route = require('../models/Route');

// Create a new Route
router.post('/', async (req, res) => {
    try {
        const newRoute = new Route(req.body);
        const savedRoute = await newRoute.save();
        res.status(201).json(savedRoute);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all Routes
router.get('/', async (req, res) => {
    try {
        const routes = await Route.find().sort({ createdAt: -1 });
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a Route
router.put('/:id', async (req, res) => {
    try {
        const updatedRoute = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedRoute);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a Route
router.delete('/:id', async (req, res) => {
    try {
        await Route.findByIdAndDelete(req.params.id);
        res.json({ message: 'Route deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
