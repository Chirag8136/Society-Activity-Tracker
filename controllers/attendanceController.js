const Event = require('../models/Event');
const Attendance = require('../models/Attendance');

const LATE_GRACE_PERIOD_MINUTES = 15;

const computeAttendanceStatus = (event, checkInTime) => {
  if (event.eventType === 'Task') {
    return 'submitted';
  }

  const scheduledStart = new Date(event.date);

  if (event.startTime) {
    const [hours, minutes] = event.startTime.split(':').map(Number);
    scheduledStart.setHours(hours, minutes, 0, 0);
  }

  const graceDeadline = new Date(scheduledStart.getTime() + LATE_GRACE_PERIOD_MINUTES * 60 * 1000);
  return checkInTime > graceDeadline ? 'late' : 'present';
};

/**
 * POST /api/attendance/check-in
 * Handles check-ins and task deliverable submissions.
 */
const checkIn = async (req, res, next) => {
  try {
    const { code, submissionUrl, submissionNotes } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ message: 'Check-in or Task code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();

    const query = { checkInCode: normalizedCode, isActive: true };
    if (req.society) {
      query.society = req.society._id;
    }

    const event = await Event.findOne(query);
    if (!event) {
      return res.status(404).json({ message: 'Invalid code or event is no longer active' });
    }

    const now = new Date();
    if (now > event.windowExpiresAt) {
      if (event.isActive) {
        event.isActive = false;
        await event.save();
      }
      return res.status(400).json({ message: 'Check-in or submission window has closed' });
    }

    const existingAttendance = await Attendance.findOne({ user: req.user._id, event: event._id });
    if (existingAttendance) {
      return res.status(409).json({ message: 'You have already checked in / submitted for this event/task' });
    }

    const status = computeAttendanceStatus(event, now);

    let attendance;
    try {
      attendance = await Attendance.create({
        society: event.society,
        user: req.user._id,
        event: event._id,
        checkInTime: now,
        status,
        submissionUrl: submissionUrl ? submissionUrl.trim() : '',
        submissionNotes: submissionNotes ? submissionNotes.trim() : '',
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'You have already checked in / submitted for this event/task' });
      }
      throw err;
    }

    const actionName = event.eventType === 'Task' ? 'Task submitted' : 'Checked in';

    return res.status(201).json({
      message: `${actionName} successfully`,
      attendance,
      event: {
        id: event._id,
        title: event.title,
        eventType: event.eventType,
        date: event.date,
        startTime: event.startTime,
        points: event.points,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkIn };
