const express = require('express');
const router = express.Router();
const {
  addCommission,
  getAllCommissions,
  getCommissionById,
  updateCommission,
  deleteCommission
} = require('../controllers/commissionController');

// RESTful routes
router.post('/', addCommission);
router.get('/', getAllCommissions);
router.get('/:id', getCommissionById);
router.put('/:id', updateCommission);
router.delete('/:id', deleteCommission);

module.exports = router;