const express = require('express');
const { getStats } = require('../controllers/dashboardController');
const { verifyToken, requireSociety, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats -> admin of active society
router.get('/stats', verifyToken, requireSociety, requireAdmin, getStats);

module.exports = router;
