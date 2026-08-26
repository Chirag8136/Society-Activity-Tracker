const express = require('express');
const { getMembers, getMemberById, updateMemberStatus } = require('../controllers/memberController');
const { verifyToken, requireSociety, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/members -> admin of active society
router.get('/', verifyToken, requireSociety, requireAdmin, getMembers);

// GET /api/members/:id -> active society members
router.get('/:id', verifyToken, requireSociety, getMemberById);

// PATCH /api/members/:id/status -> admin of active society
router.patch('/:id/status', verifyToken, requireSociety, requireAdmin, updateMemberStatus);

module.exports = router;
