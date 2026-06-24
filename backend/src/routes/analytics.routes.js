const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getSummary,
  getByStatus,
  getByWeek,
  getByCompany,
} = require('../controllers/analytics.controller');

// All analytics routes require a valid JWT
router.use(authenticate);

router.get('/summary', getSummary);
router.get('/by-status', getByStatus);
router.get('/by-week', getByWeek);
router.get('/by-company', getByCompany);

module.exports = router;
