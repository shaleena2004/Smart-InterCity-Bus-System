const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register a User
router.post('/register', async (req, res) => {
    try {
        let { name, email, password, phone, role } = req.body;
        email = email?.trim()?.toLowerCase();
        password = password?.trim();
        // Normalize phone: remove non-numeric and take last 9 digits
        const cleanPhone = phone?.replace(/\D/g, '').slice(-9);

        // Check if user exists
        let user = await User.findOne({ 
            $or: [{ email }, { phone: cleanPhone }] 
        });
        if (user) return res.status(400).json({ message: 'User with this email or phone already exists' });

        user = new User({ name, email, password, phone: cleanPhone, role });
        console.log(`Saving User: Name=${name}, Phone=${cleanPhone}, Role=${role}`);
        await user.save();

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        let { phone, password } = req.body;
        if (!phone || !password) return res.status(400).json({ message: 'Phone and password required' });
        
        // Normalize phone: remove non-numeric and take last 9 digits
        const cleanPhone = phone.replace(/\D/g, '').slice(-9);
        password = password?.trim();

        console.log(`Login Attempt: Phone=${cleanPhone}, Pwd=${password}`);
        
        const user = await User.findOne({ phone: cleanPhone });

        if (!user) {
            console.log("User not found in DB");
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.password !== password) {
            console.log(`Password mismatch: DB=${user.password}, Input=${password}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log("Login successful");
        res.json({ message: 'Login successful', user });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get all Users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update User Profile
router.put('/:id', async (req, res) => {
    try {
        const { name, phone } = req.body;
        const cleanPhone = phone?.replace(/\D/g, '').slice(-9);
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, phone: cleanPhone },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
