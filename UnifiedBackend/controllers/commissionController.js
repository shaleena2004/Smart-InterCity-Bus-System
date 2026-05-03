const Commission = require('../models/Commission');

// CREATE
exports.addCommission = async (req, res) => {
  try {
    const { busCompany, amount, description, date } = req.body;
    if (!busCompany || !amount) {
      return res.status(400).json({ error: 'Bus company and amount are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    const commission = new Commission({ busCompany, amount, description, date });
    await commission.save();
    res.status(201).json(commission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ ALL
exports.getAllCommissions = async (req, res) => {
  try {
    const commissions = await Commission.find().sort({ date: -1 });
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
exports.getCommissionById = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) return res.status(404).json({ error: 'Commission not found' });
    res.json(commission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateCommission = async (req, res) => {
  try {
    const { busCompany, amount, description, date } = req.body;
    if (amount && Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    const updated = await Commission.findByIdAndUpdate(
      req.params.id,
      { busCompany, amount, description, date },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Commission not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
exports.deleteCommission = async (req, res) => {
  try {
    const deleted = await Commission.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Commission not found' });
    res.json({ message: 'Commission deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};