const express = require("express");
const router = express.Router();

const {
  getSupplierPerformance,
  addTrip,
  addIncident,
  addComplaint,
  getAllComplaints,
  getAllIncidents,
} = require("../controllers/performanceController");

// Operational Event Logging
router.post("/trip", addTrip);
router.post("/incident", addIncident);
router.post("/feedback", addComplaint);
router.post("/complaint", addComplaint);

// List all feedback/complaints
router.get("/feedback", getAllComplaints);
router.get("/complaints", getAllComplaints);
router.get("/debug-trips", async (req, res) => {
  const Trip = require("../models/Trip");
  const trips = await Trip.find({});
  res.json(trips);
});
router.get("/list-all", (req, res, next) => {
  console.log(">>> Express matched /list-all route");
  next();
}, getAllIncidents);
router.patch("/incidents/:id", require("../controllers/performanceController").updateIncidentStatus);
router.put("/incidents/:id", require("../controllers/performanceController").updateIncident);
router.delete("/incidents/:id", require("../controllers/performanceController").deleteIncident);

// Supplier Performance Overview
router.get("/stats/:id", getSupplierPerformance);

// Driver Performance & History
router.get("/driver-stats/:driverId", require("../controllers/performanceController").getDriverPerformance);

module.exports = router;