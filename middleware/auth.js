const mongoose = require('mongoose');
const User = require('../models/User');
const Society = require('../models/Society');
const Membership = require('../models/Membership');
const { verifyToken: verifyJwt } = require('../utils/token');

/**
 * verifyToken
 * Validates the JWT Bearer token and attaches req.user.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization header missing or malformed. Expected format: "Bearer <token>"',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired. Please log in again.' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      return next(err);
    }

    if (!decoded.id) {
      return res.status(401).json({ message: 'Token payload is malformed' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireSociety
 * Resolves the tenant (Society) for the current request via header `x-society-id`
 * or user's active membership, and verifies the user is a valid member.
 */
const requireSociety = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const societyIdHeader = req.headers['x-society-id'] || req.query.societyId || req.body.societyId;
    let membership;

    if (societyIdHeader && mongoose.Types.ObjectId.isValid(societyIdHeader)) {
      membership = await Membership.findOne({
        user: req.user._id,
        society: societyIdHeader,
        status: 'active',
      }).populate('society');
    } else {
      // Fall back to first active membership if no header provided
      membership = await Membership.findOne({
        user: req.user._id,
        status: 'active',
      }).populate('society');
    }

    if (!membership || !membership.society) {
      return res.status(403).json({
        message: 'No active society membership found for this request. Please select or join a society.',
      });
    }

    req.society = membership.society;
    req.membership = membership;
    req.userRole = membership.role; // 'admin' | 'member' for THIS society

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireAdmin
 * Checks if the user is an admin of the ACTIVE society.
 */
const requireAdmin = (req, res, next) => {
  if (!req.membership) {
    return res.status(401).json({ message: 'Society context required before admin check' });
  }

  if (req.membership.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: this action requires administrator privileges for this society' });
  }

  next();
};

module.exports = { verifyToken, requireSociety, requireAdmin };
