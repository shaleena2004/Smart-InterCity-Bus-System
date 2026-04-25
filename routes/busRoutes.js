const express = require("express");
const router = express.Router();

const {
  createBus,
  getBuses,
  getBusById,
  updateBus,
  changeBusStatus,
  deleteBus
} = require("../controllers/busController");


// CREATE BUS
router.post("/", createBus);

// GET ALL BUSES
router.get("/", getBuses);

// GET SINGLE BUS
router.get("/:id", getBusById);

// UPDATE BUS DETAILS
router.put("/:id", updateBus);

// ACTIVATE / DEACTIVATE BUS
router.patch("/:id/status", changeBusStatus);

// DELETE BUS
router.delete("/:id", deleteBus);

module.exports = router;