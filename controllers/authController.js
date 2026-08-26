const { z } = require('zod');
const User = require('../models/User');
const Society = require('../models/Society');
const Membership = require('../models/Membership');
const { generateToken } = require('../utils/token');

const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Please provide a valid email address'),
  password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  joinCode: z.string().trim().toUpperCase().optional(),
  department: z.string().trim().max(100).optional(),
  position: z.string().trim().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Please provide a valid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const formatZodError = (error) =>
  error.errors.map((e) => ({
    field: e.path.join('.') || '(root)',
    message: e.message,
  }));

const getUserSocieties = async (userId) => {
  const memberships = await Membership.find({ user: userId, status: 'active' }).populate('society');
  return memberships.filter((m) => m.society).map((m) => ({
    society: m.society,
    role: m.role,
    department: m.department,
    position: m.position,
    membershipId: m._id,
  }));
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatZodError(parsed.error) });
    }

    const { name, email, password, joinCode, department, position } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });

    // If a join code was provided during registration, join the society immediately
    if (joinCode) {
      const society = await Society.findOne({ joinCode });
      if (society) {
        await Membership.create({
          user: user._id,
          society: society._id,
          role: 'member',
          department: department || '',
          position: position || 'Member',
          status: 'active',
        });
      }
    }

    const token = generateToken({ id: user._id.toString(), email: user.email });
    const societies = await getUserSocieties(user._id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
      societies,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatZodError(parsed.error) });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user._id.toString(), email: user.email });
    const societies = await getUserSocieties(user._id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
      societies,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const societies = await getUserSocieties(req.user._id);
    return res.status(200).json({ user: req.user.toJSON(), societies });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
