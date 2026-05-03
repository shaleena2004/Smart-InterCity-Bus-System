const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  busCompany: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' }
});

module.exports = mongoose.model('Commission', commissionSchema);