const mongoose = require("mongoose");

const supplierRevenueAllocationSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    supplierId: { type: String, required: true },
    busId: { type: String, required: true },
    grossAmount: { type: Number, required: true },
    supplierAmount: { type: Number, required: true },
    platformAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "TRANSFERRED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SupplierRevenueAllocation",
  supplierRevenueAllocationSchema
);