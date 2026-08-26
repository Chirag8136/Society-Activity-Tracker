const mongoose = require('mongoose');
const crypto = require('crypto');
const { z } = require('zod');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const { formatZodError } = require('../utils/formatZodError');

const DEFAULT_CHECKIN_WINDOW_MINUTES = 60;
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateCheckInCode = (length = 6) => {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  }
  return code;
};

const generateUniqueCheckInCode = async () => {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = generateCheckInCode();
    // eslint-disable-next-line no-await-in-loop
    const existing = await Event.findOne({ checkInCode: code });
    if (!existing) return code;
  }
  throw new Error('Failed to generate a unique check-in code after multiple attempts. Please retry.');
};

const createEventSchema = z
  .object({
    title: z.string({ required_error: 'Title is required' }).trim().min(2, 'Title must be at least 2 characters').max(150),
    eventType: z.enum(Event.ALL_EVENT_TYPES, {
      required_error: 'eventType is required',
      invalid_type_error: `eventType must be one of: ${Event.ALL_EVENT_TYPES.join(', ')}`,
    }),
    date: z.coerce.date({ required_error: 'date is required', invalid_type_error: 'date must be a valid date' }),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:MM (24hr) format')
      .optional(),
    windowExpiresAt: z.coerce.date({ invalid_type_error: 'windowExpiresAt must be a valid date' }).optional(),
    checkInWindowMinutes: z.coerce.number().int().positive('checkInWindowMinutes must be a positive integer').optional(),
    points: z.coerce.number().int().nonnegative('points cannot be negative').optional(),
  })
  .refine((data) => !(data.windowExpiresAt && data.checkInWindowMinutes), {
    message: 'Provide either windowExpiresAt or checkInWindowMinutes, not both',
    path: ['windowExpiresAt'],
  });

/**
 * POST /api/events (admin of active society)
 */
const createEvent = async (req, res, next) => {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatZodError(parsed.error) });
    }

    const { title, eventType, date, startTime, points } = parsed.data;
    let { windowExpiresAt } = parsed.data;
    const { checkInWindowMinutes } = parsed.data;

    if (!windowExpiresAt) {
      const minutes = checkInWindowMinutes || DEFAULT_CHECKIN_WINDOW_MINUTES;
      windowExpiresAt = new Date(date.getTime() + minutes * 60 * 1000);
    } else if (windowExpiresAt < date) {
      return res.status(400).json({ message: 'windowExpiresAt cannot be earlier than the event date' });
    }

    const checkInCode = await generateUniqueCheckInCode();

    const eventData = {
      society: req.society._id,
      title,
      eventType,
      date,
      startTime,
      checkInCode,
      windowExpiresAt,
      createdBy: req.user._id,
    };
    if (points !== undefined) eventData.points = points;

    const event = await Event.create(eventData);
    await event.populate('createdBy', 'name email');

    return res.status(201).json({ message: 'Event created successfully', event });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Generated check-in code collided. Please retry.' });
    }
    next(err);
  }
};

/**
 * GET /api/events (protected, scoped to active society)
 */
const getEvents = async (req, res, next) => {
  try {
    const { filter } = req.query;
    const now = new Date();

    let query = { society: req.society._id };
    let sort = { date: -1 };

    if (filter === 'upcoming') {
      query.date = { $gte: now };
      sort = { date: 1 };
    } else if (filter === 'past') {
      query.date = { $lt: now };
      sort = { date: -1 };
    }

    const events = await Event.find(query).sort(sort).populate('createdBy', 'name email');

    return res.status(200).json({ count: events.length, events });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/events/:id (protected)
 */
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findOne({ _id: id, society: req.society._id }).populate('createdBy', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendees = await Attendance.find({ event: id })
      .populate('user', 'name email department position')
      .sort({ checkInTime: 1 });

    return res.status(200).json({
      event,
      attendeeCount: attendees.length,
      attendees,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/events/:id/close (admin only)
 */
const closeEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findOne({ _id: id, society: req.society._id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isActive) {
      return res.status(400).json({ message: 'This event check-in window is already closed' });
    }

    event.isActive = false;
    const now = new Date();
    if (event.windowExpiresAt > now) {
      event.windowExpiresAt = now;
    }
    await event.save();

    return res.status(200).json({ message: 'Check-in window closed successfully', event });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/events/:id/extend (admin only)
 * Extends the deadline/windowExpiresAt of an event or task.
 */
const extendEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const { extensionMinutes, newWindowExpiresAt } = req.body;

    const event = await Event.findOne({ _id: id, society: req.society._id });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let updatedExpiry;
    const now = new Date();

    if (newWindowExpiresAt) {
      updatedExpiry = new Date(newWindowExpiresAt);
    } else if (extensionMinutes) {
      const baseTime = event.windowExpiresAt > now ? new Date(event.windowExpiresAt) : now;
      updatedExpiry = new Date(baseTime.getTime() + parseInt(extensionMinutes) * 60 * 1000);
    } else {
      return res.status(400).json({ message: 'Provide either extensionMinutes or newWindowExpiresAt' });
    }

    if (updatedExpiry <= now) {
      return res.status(400).json({ message: 'New deadline must be in the future' });
    }

    event.windowExpiresAt = updatedExpiry;
    event.isActive = true; // Reopen the window if it was closed
    await event.save();

    return res.status(200).json({
      message: `Deadline extended successfully to ${updatedExpiry.toLocaleString()}`,
      event,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createEvent, getEvents, getEventById, closeEvent, extendEvent };
