const mongoose = require('mongoose');

const USER_ROLES = ['passenger', 'driver', 'staff', 'finance', 'supplier', 'admin', 'super-admin', 'manager'];

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, sparse: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },
    role: { type: String, enum: USER_ROLES, default: 'passenger' },
    assignedVehicle: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isActive: { type: Boolean, default: true },
    adminType: String,
    adminRole: String,
    bloodGroup: String,
    emergencyContacts: [{
        name: String,
        relationship: String,
        phone: String,
    }],
    profileImage: String,
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
