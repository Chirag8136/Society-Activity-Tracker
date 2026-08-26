const mongoose = require('mongoose');
const { z } = require('zod');
const Contribution = require('../models/Contribution');
const User = require('../models/User');
const Membership = require('../models/Membership');
const { formatZodError } = require('../utils/formatZodError');

const createContributionSchema = z.object({
  user: z
    .string({ required_error: 'user is required' })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'user must be a valid Mongo ObjectId' }),
  title: z.string({ required_error: 'Title is required' }).trim().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(Contribution.CATEGORIES, {
    required_error: 'category is required',
    invalid_type_error: `category must be one of: ${Contribution.CATEGORIES.join(', ')}`,
  }),
  points: z.coerce.number({ required_error: 'points is required' }).int().nonnegative('points cannot be negative'),
});

/**
 * POST /api/contributions (admin of active society)
 */
const createContribution = async (req, res, next) => {
  try {
    const parsed = createContributionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatZodError(parsed.error) });
    }

    const { user, title, description, category, points } = parsed.data;

    // Verify target user is an active member of this society
    const memberRecord = await Membership.findOne({ user, society: req.society._id, status: 'active' }).populate('user');
    if (!memberRecord || !memberRecord.user) {
      return res.status(404).json({ message: 'Target member not found in this society' });
    }

    const contribution = await Contribution.create({
      society: req.society._id,
      user,
      title,
      description,
      category,
      points,
      loggedBy: req.user._id,
    });

    await contribution.populate([
      { path: 'user', select: 'name email' },
      { path: 'loggedBy', select: 'name email' },
    ]);

    return res.status(201).json({ message: 'Contribution logged successfully', contribution });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/contributions/member/:userId (protected)
 */
const getContributionsByMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const query = { user: userId };
    if (req.society) {
      query.society = req.society._id;
    }

    const contributions = await Contribution.find(query)
      .populate('loggedBy', 'name email')
      .sort({ date: -1 });

    const totalPoints = contributions.reduce((sum, c) => sum + c.points, 0);

    return res.status(200).json({
      user: { id: targetUser._id, name: targetUser.name, email: targetUser.email },
      count: contributions.length,
      totalPoints,
      contributions,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createContribution, getContributionsByMember };
