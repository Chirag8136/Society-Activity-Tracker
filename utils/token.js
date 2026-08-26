const jwt = require('jsonwebtoken');

const DEFAULT_EXPIRY = process.env.JWT_EXPIRE || '7d';

/**
 * Generates a signed JWT containing user identity claims { id, email, role }.
 */
const generateToken = ({ id, email, role = 'member' }, expiresIn = DEFAULT_EXPIRY) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  if (!id || !email) {
    throw new Error('generateToken requires "id" and "email" in the payload');
  }

  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verifies and decodes a JWT.
 */
const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken, DEFAULT_EXPIRY };
