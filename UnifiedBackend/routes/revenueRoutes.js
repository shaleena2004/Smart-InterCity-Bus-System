const express = require('express');
const router = express.Router();
const {
  addRevenue,
  getAllRevenue,
  getRevenueById,
  updateRevenue,
  deleteRevenue,
  getReport
} = require('../controllers/revenueController');

// RESTful routes
router.post('/', addRevenue);
router.get('/', getAllRevenue);
router.get('/report', getReport);
router.get('/:id', getRevenueById);
router.put('/:id', updateRevenue);
router.delete('/:id', deleteRevenue);

module.exports = router;