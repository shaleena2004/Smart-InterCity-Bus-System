const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },

    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    location: {
        latitude: Number,
        longitude: Number
    },

    type: {
        type: String,
        enum: ['accident', 'breakdown', 'sos', 'medical', 'other'],
        default: 'other'
    },

    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ['open', 'investigating', 'resolved', 'closed'],
        default: 'open'
    },

    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Incident", incidentSchema);