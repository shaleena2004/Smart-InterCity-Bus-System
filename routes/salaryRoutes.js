const express = require('express');
const router = express.Router();
const {
  addSalary,
  getAllSalaries,
  getSalaryById,
  updateSalary,
  deleteSalary
} = require('../controllers/salaryController');

router.post('/add', addSalary);
router.get('/all', getAllSalaries);
router.get('/:id', getSalaryById);
router.put('/update/:id', updateSalary);
router.delete('/delete/:id', deleteSalary);

module.exports = router;