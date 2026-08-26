const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register  -> public (role protection enforced inside the controller)
router.post('/register', register);

// POST /api/auth/login     -> public
router.post('/login', login);

// GET  /api/auth/me        -> protected
router.get('/me', verifyToken, getMe);

module.exports = router;
