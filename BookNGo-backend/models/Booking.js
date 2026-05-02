const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  route: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String },
  status: { type: String, required: true },
  seat: { type: String, required: true },
  busType: { type: String, required: true },
  name: { type: String },
  contact: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
