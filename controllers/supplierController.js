const Supplier = require("../models/Supplier");

// CREATE Supplier
exports.createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json({
            message: "Supplier created successfully",
            supplier
        });
    } catch (error) {
        res.status(400).json({
            message: "Error creating supplier",
            error: error.message
        });
    }
};

// GET all suppliers
exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching suppliers",
            error: error.message
        });
    }
};

// GET Single Supplier
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: "Supplier not found" });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching supplier",
            error: error.message
        });
    }
};

// UPDATE Supplier
exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({
            message: "Supplier updated successfully",
            supplier
        });
    } catch (error) {
        res.status(400).json({
            message: "Error updating supplier",
            error: error.message
        });
    }
};

// ACTIVATE / DEACTIVATE Supplier
exports.changeSupplierStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        res.status(200).json(supplier);
    } catch (error) {
        res.status(500).json({ message: "Failed to change supplier status" });
    }
};

// DELETE SUPPLIER
exports.deleteSupplier = async (req, res) => {
    try {
        await Supplier.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Supplier deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete supplier" });
    }
};