const express = require("express");
const router = express.Router();

const {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    changeSupplierStatus,
    deleteSupplier
} = require("../controllers/supplierController");


// CREATE supplier
router.post("/", createSupplier);

// GET all suppliers
router.get("/", getSuppliers);

// GET single supplier by ID
router.get("/:id", getSupplierById);

// UPDATE supplier details
router.put("/:id", updateSupplier);

// CHANGE supplier status (Active / Inactive)
router.patch("/:id/status", changeSupplierStatus);

// DELETE supplier
router.delete("/:id", deleteSupplier);

module.exports = router;
``