const mongoose = require('mongoose');
const { z } = require('zod');
const Society = require('../models/Society');
const Membership = require('../models/Membership');
const { formatZodError } = require('../utils/formatZodError');

const createSocietySchema = z.object({
  name: z.string({ required_error: 'Society name is required' }).trim().min(2, 'Name must be at least 2 characters').max(100),
  category: z.enum(Society.CATEGORIES).optional(),
  description: z.string().trim().max(1000).optional(),
  code: z.string().trim().toUpperCase().optional(),
});

const joinSocietySchema = z.object({
  joinCode: z.string({ required_error: 'Join code is required' }).trim().toUpperCase(),
  department: z.string().trim().max(100).optional(),
  position: z.string().trim().max(100).optional(),
});

/**
 * POST /api/societies
 * Creates a new society and automatically registers the creator as an 'admin'.
 */
const createSociety = async (req, res, next) => {
  try {
    const parsed = createSocietySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatZodError(parsed.error) });
    }

    const { name, category, description, code } = parsed.data;

    const societyData = {
      name,
      category: category || 'Technical',
      description: description || '',
      createdBy: req.user._id,
    };
    if (code) societyData.code = code;

    const society = await Society.create(societyData);

    // Creator is automatically assigned the 'admin' role in this society
    const membership = await Membership.create({
      user: req.user._id,
      society: society._id,
      role: 'admin',
      position: 'Founder / Admin',
      department: 'Executive',
      status: 'active',
    });

    return res.status(201).json({
      message: 'Society created successfully',
      society,
      membership,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Society code or join code already exists. Please try another code.' });
    }
    next(err);
  }
};

/**
 * GET /api/societies/my
 * Returns all societies the authenticated user belongs to.
 */
const getMySocieties = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ user: req.user._id, status: 'active' })
      .populate('society')
      .sort({ createdAt: -1 });

    const societies = memberships
      .filter((m) => m.society) // safeguard if a society was deleted
      .map((m) => ({
        society: m.society,
        role: m.role,
        department: m.department,
        position: m.position,
        membershipId: m._id,
        joiningDate: m.joiningDate,
      }));

    return res.status(200).json({
      count: societies.length,
      societies,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/societies/join
 * Joins a society using its unique 6-character joinCode.
 */
const joinSociety = async (req, res, next) => {
  try {
    const parsed = joinSocietySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatZodError(parsed.error) });
    }

    const { joinCode, department, position } = parsed.data;

    const society = await Society.findOne({ joinCode });
    if (!society) {
      return res.status(404).json({ message: 'Invalid join code. Society not found.' });
    }

    // Check if already a member
    const existing = await Membership.findOne({ user: req.user._id, society: society._id });
    if (existing) {
      if (existing.status === 'inactive') {
        existing.status = 'active';
        await existing.save();
        return res.status(200).json({ message: 'Reactivated membership in society', society, membership: existing });
      }
      return res.status(409).json({ message: 'You are already a member of this society', society, membership: existing });
    }

    const membership = await Membership.create({
      user: req.user._id,
      society: society._id,
      role: 'member',
      department: department || '',
      position: position || 'Member',
      status: 'active',
    });

    return res.status(201).json({
      message: `Joined "${society.name}" successfully`,
      society,
      membership,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/societies/:id
 * Fetches details of a specific society.
 */
const getSocietyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid society ID format' });
    }

    const society = await Society.findById(id).populate('createdBy', 'name email');
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    const memberCount = await Membership.countDocuments({ society: id, status: 'active' });

    return res.status(200).json({ society, memberCount });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSociety, getMySocieties, joinSociety, getSocietyById };
