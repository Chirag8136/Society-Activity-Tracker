const express = require('express');
const { createContribution, getContributionsByMember } = require('../controllers/contributionController');
const { verifyToken, requireSociety, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/contributions -> admin of active society
router.post('/', verifyToken, requireSociety, requireAdmin, createContribution);

// GET /api/contributions/member/:userId -> active society members
router.get('/member/:userId', verifyToken, requireSociety, getContributionsByMember);

module.exports = router;
