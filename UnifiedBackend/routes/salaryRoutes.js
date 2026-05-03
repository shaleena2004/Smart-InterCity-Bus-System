const express = require('express');
const router = express.Router();
const {
  addSalary,
  getAllSalaries,
  getSalaryById,
  updateSalary,
  deleteSalary
} = require('../controllers/salaryController');

// RESTful routes
router.post('/', addSalary);
router.get('/', getAllSalaries);
router.get('/:id', getSalaryById);
router.put('/:id', updateSalary);
router.delete('/:id', deleteSalary);

module.exports = router;