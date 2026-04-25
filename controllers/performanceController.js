const Bus = require("../models/Bus");
const Supplier = require("../models/Supplier");

// ==============================
// REQUIRED MODELS
// ==============================
const Incident = require("../models/Incident");
const Complaint = require("../models/Complaint"); // ✅ Used as FEEDBACK
const Trip = require("../models/Trip");

// ==============================
// PERFORMANCE CALCULATION HELPERS
// ==============================
function calculatePerformanceScore({
  onTimeTrips,
  lateTrips,
  incidentCount,
  positiveFeedbackCount,
  negativeFeedbackCount
}) {
  let score = 100;

  score += onTimeTrips * 2;
  score -= lateTrips * 3;
  score -= incidentCount * 15;
  score += positiveFeedbackCount * 3;
  score -= negativeFeedbackCount * 7;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return score;
}

function getPerformanceGrade(score) {
  if (score >= 91) return "A+";
  if (score >= 75) return "A";
  if (score >= 66) return "B";
  if (score >= 50) return "C";
  return "D";
}

// ==============================
// ADD TRIP
// ==============================
exports.addTrip = async (req, res) => {
  try {
    const { supplierId, busId, status } = req.body;

    const newTrip = await Trip.create({
      supplierId,
      busId,
      status: status.toUpperCase(), // ON_TIME / LATE
      createdAt: new Date()
    });

    res.status(201).json({
      message: "Trip recorded successfully",
      data: newTrip
    });
  } catch (error) {
    res.status(500).json({
      message: "Error recording trip",
      error: error.message
    });
  }
};

// ==============================
// ADD INCIDENT
// ==============================
exports.addIncident = async (req, res) => {
  try {
    const { supplierId, busId, description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Incident description is required"
      });
    }

    const newIncident = await Incident.create({
      supplierId,
      busId,
      description,
      date: new Date()
    });

    res.status(201).json({
      message: "Incident logged successfully",
      data: newIncident
    });
  } catch (error) {
    res.status(500).json({
      message: "Error logging incident",
      error: error.message
    });
  }
};

// ==============================
// ✅ ADD FEEDBACK (via Complaint model)
// ==============================
exports.addComplaint = async (req, res) => {
  try {
    const { supplierId, busId, rating, comment } = req.body;

    if (!supplierId || !rating || !comment) {
      return res.status(400).json({
        message: "Missing feedback fields"
      });
    }

    const newFeedback = await Complaint.create({
      supplierId,
      busId,
      rating,   // POSITIVE / NEGATIVE
      comment
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      data: newFeedback
    });
  } catch (error) {
    console.error("Add feedback error:", error);
    res.status(500).json({
      message: "Error submitting feedback"
    });
  }
};

// ==============================
// listing feedbacks
// ==============================
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("busId", "busNumber plateNumber")
      .populate("supplierId", "name companyName")
      .sort({ date: -1 });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching feedbacks",
      error: error.message
    });
  }
};

// ==============================
// GET SUPPLIER PERFORMANCE
// ==============================
exports.getSupplierPerformance = async (req, res) => {
  try {
    const supplierId = req.params.id;

    // ----- Trips -----
    const onTimeTrips = await Trip.countDocuments({
      supplierId,
      status: "ON_TIME"
    });

    const lateTrips = await Trip.countDocuments({
      supplierId,
      status: "LATE"
    });

    const totalTrips = onTimeTrips + lateTrips;

    const onTimePercentage =
      totalTrips === 0 ? 0 : Number(((onTimeTrips / totalTrips) * 100).toFixed(2));

    const delayedPercentage =
      totalTrips === 0 ? 0 : Number((100 - onTimePercentage).toFixed(2));

    // ----- Incidents -----
    const incidentCount = await Incident.countDocuments({ supplierId });

    // ----- Feedbacks (from Complaint) -----
    const positiveFeedbackCount = await Complaint.countDocuments({
      supplierId,
      rating: "POSITIVE"
    });

    const negativeFeedbackCount = await Complaint.countDocuments({
      supplierId,
      rating: "NEGATIVE"
    });

    const totalFeedbacks = positiveFeedbackCount + negativeFeedbackCount;

    // ----- Score & Grade -----
    const score = calculatePerformanceScore({
      onTimeTrips,
      lateTrips,
      incidentCount,
      positiveFeedbackCount,
      negativeFeedbackCount
    });

    const grade = getPerformanceGrade(score);

    res.status(200).json({
      supplierId,
      score,
      grade,

      trips: {
        total: totalTrips,
        onTime: onTimeTrips,
        delayed: lateTrips,
        onTimePercentage,
        delayedPercentage
      },

      incidents: {
        total: incidentCount
      },

      feedbacks: {
        total: totalFeedbacks,
        positive: positiveFeedbackCount,
        negative: negativeFeedbackCount
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating performance",
      error: error.message
    });
  }
};