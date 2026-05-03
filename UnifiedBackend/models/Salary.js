const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  staffName: { type: String, required: true },
  role: { type: String, required: true },
  amount: { type: Number, required: true }
});

module.exports = mongoose.model('Salary', salarySchema);