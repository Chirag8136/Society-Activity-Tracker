const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  closeEvent,
  extendEvent,
} = require('../controllers/eventController');
const { verifyToken, requireSociety, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/events -> admin of active society
router.post('/', verifyToken, requireSociety, requireAdmin, createEvent);

// GET /api/events -> active society members
router.get('/', verifyToken, requireSociety, getEvents);

// GET /api/events/:id -> active society members
router.get('/:id', verifyToken, requireSociety, getEventById);

// POST /api/events/:id/close -> admin of active society
router.post('/:id/close', verifyToken, requireSociety, requireAdmin, closeEvent);

// PATCH /api/events/:id/extend -> admin of active society
router.patch('/:id/extend', verifyToken, requireSociety, requireAdmin, extendEvent);

module.exports = router;
