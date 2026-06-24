const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
} = require('../controllers/job.controller');

// All job routes require a valid JWT
router.use(authenticate);

// ── Collection routes ──
router.get('/', getAllJobs);
router.post('/', createJob);

// ── Single-resource routes ──
router.get('/:id', getJobById);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

// ── Dedicated status update ──
router.put('/:id/status', updateJobStatus);

module.exports = router;
