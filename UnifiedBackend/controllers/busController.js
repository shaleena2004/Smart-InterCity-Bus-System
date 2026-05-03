const Bus = require("../models/Bus");
const mongoose = require("mongoose");


// CREATE BUS
exports.createBus = async (req, res) => {
  try {
    console.log("Creating Bus Payload:", JSON.stringify(req.body, null, 2));
    const bus = await Bus.create(req.body);
    res.status(201).json({
      message: "Bus added successfully",
      bus
    });
  } catch (error) {
    console.error("Create Bus Error:", error);
    res.status(400).json({
      message: "Error adding bus",
      error: error.message
    });
  }
};

// GET ALL BUSES
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate("supplierId");
    res.status(200).json(buses);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching buses",
      error: error.message
    });
  }
};

// GET BUS BY ID
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate("supplierId");
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json(bus);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bus",
      error: error.message
    });
  }
};

// UPDATE BUS
exports.updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`\n--- DIRECT DB UPDATE for Bus: ${id} ---`);
    
    // Bypass Mongoose and use the raw collection
    const result = await Bus.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: req.body }
    );

    console.log("DB Update Result:", result);

    if (result.matchedCount === 0) {
      console.log("!!! NO MATCHING DOCUMENT FOUND IN DB !!!");
      return res.status(404).json({ message: "Bus not found in database" });
    }

    // Fetch the updated doc to return to frontend
    const updatedBus = await Bus.findById(id);

    res.status(200).json({
      message: "Bus updated successfully (Direct)",
      bus: updatedBus
    });
  } catch (error) {
    console.error("!!! DB UPDATE CRASHED !!!:", error);
    res.status(400).json({
      message: "Error updating bus",
      error: error.message
    });
  }
};

// ACTIVATE / DEACTIVATE BUS
exports.changeBusStatus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    bus.status = bus.status === "active" ? "inactive" : "active";
    await bus.save();

    res.status(200).json({
      message: "Bus status updated",
      status: bus.status
    });
  } catch (error) {
    res.status(500).json({
      message: "Error changing bus status",
      error: error.message
    });
  }
};

// DELETE BUS
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json({
      message: "Bus deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting bus",
      error: error.message
    });
  }
};
