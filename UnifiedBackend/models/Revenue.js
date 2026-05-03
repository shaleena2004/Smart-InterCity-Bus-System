const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  ticketSales: { type: Number, required: true },
  source: { type: String, required: true },
  description: { type: String, default: '' }
});

module.exports = mongoose.model('Revenue', revenueSchema);