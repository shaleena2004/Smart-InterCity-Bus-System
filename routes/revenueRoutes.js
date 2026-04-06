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

router.post('/add', addRevenue);
router.get('/all', getAllRevenue);
router.get('/report', getReport);
router.get('/:id', getRevenueById);
router.put('/update/:id', updateRevenue);
router.delete('/delete/:id', deleteRevenue);

module.exports = router;