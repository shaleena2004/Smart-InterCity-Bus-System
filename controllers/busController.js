const Bus = require("../models/Bus");


// CREATE BUS
exports.createBus = async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json({
      message: "Bus added successfully",
      bus
    });
  } catch (error) {
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
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.status(200).json({
      message: "Bus updated successfully",
      bus
    });
  } catch (error) {
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
