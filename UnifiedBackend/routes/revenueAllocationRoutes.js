const express = require("express");
const {
  createRevenueAllocation,
  getSupplierRevenueSummary,
} = require("../controllers/revenueAllocationController");

const router = express.Router();

router.post("/", createRevenueAllocation);
router.get("/summary", getSupplierRevenueSummary);

module.exports = router;