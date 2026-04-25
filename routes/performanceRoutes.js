const express = require("express");
const router = express.Router();

const {
  getSupplierPerformance,
  addTrip,
  addIncident,
  addComplaint,
//addDummyData,
  getAllComplaints,
} = require("../controllers/performanceController");

// Operational Event Logging
router.post("/trip", addTrip);        // Log Trip (ON_TIME / LATE)
router.post("/incident", addIncident); // Log Incident
router.post("/complaint", addComplaint);


router.get("/complaints", getAllComplaints);

// Supplier Performance Overview
router.get("/:id", getSupplierPerformance);

// Development / Demo Utilities
//router.post("/:id/dummy", addDummyData);

module.exports = router;