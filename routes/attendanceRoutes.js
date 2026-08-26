const express = require('express');
const { checkIn } = require('../controllers/attendanceController');
const { verifyToken, requireSociety } = require('../middleware/auth');

const router = express.Router();

// POST /api/attendance/check-in -> any active member
router.post('/check-in', verifyToken, requireSociety, checkIn);

module.exports = router;
