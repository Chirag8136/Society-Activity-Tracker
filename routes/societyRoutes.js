const express = require('express');
const {
  createSociety,
  getMySocieties,
  joinSociety,
  getSocietyById,
} = require('../controllers/societyController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All society routes require basic authentication (verifyToken)
router.post('/', verifyToken, createSociety);
router.get('/my', verifyToken, getMySocieties);
router.post('/join', verifyToken, joinSociety);
router.get('/:id', verifyToken, getSocietyById);

module.exports = router;
