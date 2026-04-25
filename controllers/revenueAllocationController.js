const SupplierRevenueAllocation = require("../models/SupplierRevenueAllocation");
const { calculateRevenue } = require("../utils/revenueCalculator");

//revenue allocation from completed booking
const createRevenueAllocation = async (req, res) => {
  try {
    const { bookingId, supplierId, busId, totalFare, status } = req.body;

    //Guard condition
    if (status !== "COMPLETED") {
      return res.status(400).json({
        message: "Only COMPLETED bookings generate supplier revenue",
      });
    }

    //Prevent duplicate allocation
    const existing = await SupplierRevenueAllocation.findOne({ bookingId });
    if (existing) {
      return res.status(409).json({
        message: "Revenue already allocated for this booking",
      });
    }

    //Revenue calculation
    const { supplierAmount, platformAmount } =
      calculateRevenue(totalFare);

    //Save allocation
    const allocation = await SupplierRevenueAllocation.create({
      bookingId,
      supplierId,
      busId,
      grossAmount: totalFare,
      supplierAmount,
      platformAmount,
      status: "PENDING",
    });

    return res.status(201).json(allocation);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSupplierRevenueSummary = async (req, res) => {
  try {
    const summary = await SupplierRevenueAllocation.aggregate([
      { $match: { status: "PENDING" } },
      {
        $group: {
          _id: "$supplierId",
          pendingAmount: { $sum: "$supplierAmount" },
          bookingCount: { $sum: 1 },
        },
      },
    ]);

    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRevenueAllocation,
  getSupplierRevenueSummary,
};