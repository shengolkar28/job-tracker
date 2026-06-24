const express = require('express');
const router = express.Router();
const { register, login, logout, refresh, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', authenticate, getMe);

module.exports = router;