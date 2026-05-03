const Revenue = require('../models/Revenue');
const Salary = require('../models/Salary');
const Commission = require('../models/Commission');

// CREATE
exports.addRevenue = async (req, res) => {
  try {
    const { ticketSales, source, description, date } = req.body;
    if (!ticketSales || !source) {
      return res.status(400).json({ error: 'Ticket sales and source are required' });
    }
    if (Number(ticketSales) <= 0) {
      return res.status(400).json({ error: 'Ticket sales must be a positive number' });
    }
    const revenue = new Revenue({ ticketSales, source, description, date });
    await revenue.save();
    res.status(201).json(revenue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ ALL
exports.getAllRevenue = async (req, res) => {
  try {
    const revenues = await Revenue.find().sort({ date: -1 });
    res.json(revenues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
exports.getRevenueById = async (req, res) => {
  try {
    const revenue = await Revenue.findById(req.params.id);
    if (!revenue) return res.status(404).json({ error: 'Revenue not found' });
    res.json(revenue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateRevenue = async (req, res) => {
  try {
    const { ticketSales, source, description, date } = req.body;
    if (ticketSales && Number(ticketSales) <= 0) {
      return res.status(400).json({ error: 'Ticket sales must be a positive number' });
    }
    const updated = await Revenue.findByIdAndUpdate(
      req.params.id,
      { ticketSales, source, description, date },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Revenue not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
exports.deleteRevenue = async (req, res) => {
  try {
    const deleted = await Revenue.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Revenue not found' });
    res.json({ message: 'Revenue deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REPORT
exports.getReport = async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    let startDate;

    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      return res.status(400).json({ error: 'Period must be daily, weekly or monthly' });
    }

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    const revenues = await Revenue.find({ date: { $gte: startDate, $lte: endDate } });
    const salaries = await Salary.find({ date: { $gte: startDate, $lte: endDate } });
    const commissions = await Commission.find({ date: { $gte: startDate, $lte: endDate } });

    const totalRevenue = revenues.reduce((sum, r) => sum + r.ticketSales, 0);
    const totalSalaries = salaries.reduce((sum, s) => sum + s.amount, 0);
    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
    const netProfit = totalRevenue - totalSalaries - totalCommissions;

    res.json({
      period,
      startDate,
      endDate,
      totalRevenue,
      totalSalaries,
      totalCommissions,
      netProfit,
      revenueCount: revenues.length,
      salaryCount: salaries.length,
      commissionCount: commissions.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};