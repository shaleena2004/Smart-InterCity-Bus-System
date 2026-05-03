const Bus = require("../models/Bus");
const Supplier = require("../models/Supplier");
const mongoose = require("mongoose");

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
    console.log(">>> [BACKEND] addTrip received:", req.body);
    const { supplierId, busId, status, driverId, routeId } = req.body;

    const newTrip = await Trip.create({
      supplierId,
      busId,
      driverId,
      routeId,
      status: status.toUpperCase(), // ON_TIME / LATE
      date: new Date()
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
    const { supplierId, busId, busNumber, description, type, severity, userId, location } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Incident description is required"
      });
    }

    let finalBusId = busId;
    if (!finalBusId && busNumber) {
      const bus = await Bus.findOne({ busNumber: busNumber });
      if (bus) finalBusId = bus._id;
    }

    // Ensure userId is a valid ObjectId
    let userObjectId = userId;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userObjectId = new mongoose.Types.ObjectId(userId);
    }

    const newIncident = await Incident.create({
      supplierId,
      busId: finalBusId,
      userId: userObjectId,
      location,
      description,
      type: type || 'other',
      severity: severity || 'medium',
      date: new Date()
    });

    console.log(">>> [BACKEND] Incident created successfully:", {
      id: newIncident._id,
      userId: newIncident.userId,
      type: newIncident.type
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
// GET ALL INCIDENTS
// ==============================
exports.getAllIncidents = async (req, res) => {
  console.log(">>> Entering getAllIncidents API (list-all)");
  try {
    const IncidentModel = require("../models/Incident");
    const incidents = await IncidentModel.find({})
      .populate("busId", "busNumber plateNumber")
      .populate("supplierId", "name companyName")
      .populate("userId", "name phone")
      .sort({ date: -1 });
      
    console.log(`>>> Successfully fetched ${incidents.length} incidents`);
    res.status(200).json(incidents);
  } catch (error) {
    console.error("!!! GET ALL INCIDENTS CRASHED !!!", error);
    res.status(500).json({
      message: "Error fetching incidents from database",
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
// ==============================
// UPDATE INCIDENT STATUS
// ==============================
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const incident = await Incident.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.status(200).json({
      message: 'Incident status updated',
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating incident',
      error: error.message
    });
  }
};

// ==============================
// UPDATE INCIDENT (General)
// ==============================
exports.updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const incident = await Incident.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.status(200).json({
      message: 'Incident updated successfully',
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating incident',
      error: error.message
    });
  }
};

// ==============================
// DELETE INCIDENT
// ==============================
exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findByIdAndDelete(id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.status(200).json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting incident',
      error: error.message
    });
  }
};

// ==============================
// GET DRIVER PERFORMANCE
// ==============================
exports.getDriverPerformance = async (req, res) => {
  try {
    const { driverId } = req.params;
    console.log(`>>> [BACKEND] Fetching stats. ID: ${driverId} (Type: ${typeof driverId})`);
    
    // Ensure driverId is a valid ObjectId for querying
    let driverObjectId = driverId;
    if (driverId && mongoose.Types.ObjectId.isValid(driverId)) {
      driverObjectId = new mongoose.Types.ObjectId(driverId);
    }

    // Find trips by driverId and populate route
    const trips = await Trip.find({ 
      $or: [{ driverId: driverObjectId }, { driverId: driverId }] 
    }).populate('routeId', 'routeName startLocation endLocation');

    // Also find incidents and feedback where this user was the driver
    // Broad search to cover all possible field naming conventions
    const incidents = await Incident.find({
      $or: [
        { userId: driverObjectId },
        { userId: driverId },
        { driverId: driverObjectId },
        { driverId: driverId }
      ]
    }).populate("busId", "busNumber plateNumber");

    console.log(`>>> [BACKEND] Found ${incidents.length} incidents for identifier: ${driverId}`);



    console.log(`>>> [BACKEND] Found ${incidents.length} incidents for this driver`);
    const feedbacks = await Complaint.find({ driverId });


    const onTimeTrips = trips.filter(t => t.status === 'ON_TIME').length;
    const lateTrips = trips.filter(t => t.status === 'LATE').length;
    const totalTrips = trips.length;

    const onTimePercentage = totalTrips === 0 ? 100 : Math.round((onTimeTrips / totalTrips) * 100);
    
    // Calculate average rating from feedbacks (assuming rating is POSITIVE/NEGATIVE or numeric)
    const positiveCount = feedbacks.filter(f => f.rating === 'POSITIVE').length;
    const rating = totalTrips === 0 ? 5.0 : Number((4.0 + (positiveCount / (feedbacks.length || 1))).toFixed(1));

    res.status(200).json({
      tripCount: totalTrips,
      onTimePercentage: onTimePercentage + '%',
      rating: rating,
      trips: trips.sort((a,b) => new Date(b.date) - new Date(a.date)),
      incidents: incidents.sort((a,b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching driver stats", error: error.message });
  }
};
