const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journal.controller');
const { authenticate, filterByBranch } = require('../middlewares');

router.use(authenticate);

router.post('/', journalController.create);
router.get('/', filterByBranch, journalController.findAll);
router.get('/admission/:admissionId', journalController.findByAdmission);
router.patch('/:id/settle', journalController.settle);
router.delete('/:id', journalController.remove);

module.exports = router;
