const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus"
  },
  rating: {
    type: String,
    enum: ["POSITIVE", "NEGATIVE"],
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);