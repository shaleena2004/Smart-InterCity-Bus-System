const Salary = require('../models/Salary');

// CREATE
exports.addSalary = async (req, res) => {
  try {
    const { staffName, role, amount, date } = req.body;
    if (!staffName || !role || !amount) {
      return res.status(400).json({ error: 'Staff name, role and amount are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    const salary = new Salary({ staffName, role, amount, date });
    await salary.save();
    res.status(201).json(salary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ ALL
exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find().sort({ date: -1 });
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
exports.getSalaryById = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ error: 'Salary not found' });
    res.json(salary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateSalary = async (req, res) => {
  try {
    const { staffName, role, amount, date } = req.body;
    if (amount && Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    const updated = await Salary.findByIdAndUpdate(
      req.params.id,
      { staffName, role, amount, date },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Salary not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
exports.deleteSalary = async (req, res) => {
  try {
    const deleted = await Salary.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Salary not found' });
    res.json({ message: 'Salary deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};