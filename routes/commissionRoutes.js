const express = require('express');
const router = express.Router();
const {
  addCommission,
  getAllCommissions,
  getCommissionById,
  updateCommission,
  deleteCommission
} = require('../controllers/commissionController');

router.post('/add', addCommission);
router.get('/all', getAllCommissions);
router.get('/:id', getCommissionById);
router.put('/update/:id', updateCommission);
router.delete('/delete/:id', deleteCommission);

module.exports = router;