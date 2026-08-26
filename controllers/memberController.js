const mongoose = require('mongoose');
const { z } = require('zod');
const User = require('../models/User');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Contribution = require('../models/Contribution');
const Membership = require('../models/Membership');
const { formatZodError } = require('../utils/formatZodError');
const { escapeRegex } = require('../utils/escapeRegex');
const { computeCalculatedStatus, ACTIVITY_STATUS } = require('../utils/scoring');
const { getRecentPastEvents, getTotalPastEventsCount } = require('../utils/analytics');

const toIdMap = (arr) => new Map(arr.map((entry) => [entry._id.toString(), entry]));

const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    required_error: 'status is required',
    invalid_type_error: 'status must be either "active" or "inactive"',
  }),
});

/**
 * GET /api/members (admin only for active society)
 */
const getMembers = async (req, res, next) => {
  try {
    const { search, department, status } = req.query;

    if (status && !Object.values(ACTIVITY_STATUS).includes(status.toUpperCase())) {
      return res.status(400).json({
        message: `Invalid status filter. Use one of: ${Object.values(ACTIVITY_STATUS).join(', ')}`,
      });
    }

    const membershipQuery = { society: req.society._id };
    if (department) {
      membershipQuery.department = new RegExp(escapeRegex(department), 'i');
    }

    const memberships = await Membership.find(membershipQuery).populate('user').sort({ createdAt: 1 });

    let filteredMemberships = memberships.filter((m) => m.user);

    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      filteredMemberships = filteredMemberships.filter(
        (m) => re.test(m.user.name) || re.test(m.user.email)
      );
    }

    const memberUserIds = filteredMemberships.map((m) => m.user._id);

    const [totalPastEventsCount, recentEvents] = await Promise.all([
      getTotalPastEventsCount(req.society._id),
      getRecentPastEvents(req.society._id, 3),
    ]);

    const recentEventIds = recentEvents.map((e) => e._id);
    const windowStart = recentEvents.length ? recentEvents[recentEvents.length - 1].date : null;

    const [attendanceAgg, contributionAgg, windowAttendanceAgg, windowContributionAgg] = await Promise.all([
      Attendance.aggregate([
        { $match: { user: { $in: memberUserIds }, society: req.society._id } },
        { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'eventDetails' } },
        { $unwind: '$eventDetails' },
        {
          $group: {
            _id: '$user',
            attendanceCount: { $sum: 1 },
            attendancePoints: { $sum: '$eventDetails.points' },
          },
        },
      ]),
      Contribution.aggregate([
        { $match: { user: { $in: memberUserIds }, society: req.society._id } },
        { $group: { _id: '$user', contributionCount: { $sum: 1 }, contributionPoints: { $sum: '$points' } } },
      ]),
      recentEventIds.length
        ? Attendance.aggregate([
            { $match: { user: { $in: memberUserIds }, event: { $in: recentEventIds } } },
            { $group: { _id: '$user', attendedCount: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      windowStart
        ? Contribution.aggregate([
            { $match: { user: { $in: memberUserIds }, society: req.society._id, date: { $gte: windowStart } } },
            { $group: { _id: '$user', contributions: { $push: { points: '$points' } } } },
          ])
        : Promise.resolve([]),
    ]);

    const attendanceMap = toIdMap(attendanceAgg);
    const contributionMap = toIdMap(contributionAgg);
    const windowAttendanceMap = toIdMap(windowAttendanceAgg);
    const windowContributionMap = toIdMap(windowContributionAgg);

    let result = filteredMemberships.map((membership) => {
      const u = membership.user;
      const idStr = u._id.toString();
      const attendance = attendanceMap.get(idStr) || { attendanceCount: 0, attendancePoints: 0 };
      const contribution = contributionMap.get(idStr) || { contributionCount: 0, contributionPoints: 0 };
      const windowAttendedCount = (windowAttendanceMap.get(idStr) || { attendedCount: 0 }).attendedCount;
      const windowContributions = (windowContributionMap.get(idStr) || { contributions: [] }).contributions;

      const activityScore = attendance.attendancePoints + contribution.contributionPoints;
      const attendancePercentage =
        totalPastEventsCount > 0 ? Math.round((attendance.attendanceCount / totalPastEventsCount) * 100) : 0;
      const calculatedStatus = computeCalculatedStatus({
        attendedCount: windowAttendedCount,
        windowContributions,
        hasPastEvents: recentEvents.length > 0,
      });

      return {
        _id: u._id,
        membershipId: membership._id,
        name: u.name,
        email: u.email,
        department: membership.department,
        position: membership.position,
        role: membership.role,
        status: membership.status,
        joiningDate: membership.joiningDate,
        attendanceCount: attendance.attendanceCount,
        attendancePoints: attendance.attendancePoints,
        attendancePercentage,
        contributionCount: contribution.contributionCount,
        contributionPoints: contribution.contributionPoints,
        activityScore,
        calculatedStatus,
      };
    });

    if (status) {
      const statusUpper = status.toUpperCase();
      result = result.filter((m) => m.calculatedStatus === statusUpper);
    }

    result.sort((a, b) => b.activityScore - a.activityScore);

    return res.status(200).json({ count: result.length, members: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/members/:id (protected)
 */
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid member ID format' });
    }

    const member = await User.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const membership = await Membership.findOne({ user: id, society: req.society._id });
    const now = new Date();

    const [attendanceRecords, contributions, pastEvents, recentEvents, totalPastEventsCount] = await Promise.all([
      Attendance.find({ user: id, society: req.society._id }).populate('event', 'title eventType date points startTime'),
      Contribution.find({ user: id, society: req.society._id }).populate('loggedBy', 'name email'),
      Event.find({ society: req.society._id, date: { $lt: now } }).select('_id title eventType date points'),
      getRecentPastEvents(req.society._id, 3),
      getTotalPastEventsCount(req.society._id),
    ]);

    const attendanceCount = attendanceRecords.length;
    const attendancePoints = attendanceRecords.reduce((sum, a) => sum + (a.event ? a.event.points : 0), 0);
    const contributionCount = contributions.length;
    const contributionPoints = contributions.reduce((sum, c) => sum + c.points, 0);
    const activityScore = attendancePoints + contributionPoints;
    const attendancePercentage = totalPastEventsCount > 0 ? Math.round((attendanceCount / totalPastEventsCount) * 100) : 0;

    const recentEventIds = new Set(recentEvents.map((e) => e._id.toString()));
    const windowStart = recentEvents.length ? recentEvents[recentEvents.length - 1].date : null;

    const windowAttendedCount = attendanceRecords.filter(
      (a) => a.event && recentEventIds.has(a.event._id.toString())
    ).length;
    const windowContributions = windowStart
      ? contributions.filter((c) => new Date(c.date) >= windowStart).map((c) => ({ points: c.points }))
      : [];

    const calculatedStatus = computeCalculatedStatus({
      attendedCount: windowAttendedCount,
      windowContributions,
      hasPastEvents: recentEvents.length > 0,
    });

    const attendedEventIds = new Set(attendanceRecords.filter((a) => a.event).map((a) => a.event._id.toString()));
    const missedEvents = pastEvents.filter((e) => !attendedEventIds.has(e._id.toString()));

    let timeline = [];

    attendanceRecords.forEach((a) => {
      if (!a.event) return;
      timeline.push({
        type: 'meeting_attended',
        date: a.checkInTime,
        title: a.event.title,
        eventType: a.event.eventType,
        attendanceStatus: a.status,
        pointsChange: a.event.points,
      });
    });

    missedEvents.forEach((e) => {
      timeline.push({
        type: 'meeting_missed',
        date: e.date,
        title: e.title,
        eventType: e.eventType,
        attendanceStatus: null,
        pointsChange: 0,
      });
    });

    contributions.forEach((c) => {
      timeline.push({
        type: 'contribution',
        date: c.date,
        title: c.title,
        category: c.category,
        loggedBy: c.loggedBy ? { name: c.loggedBy.name, email: c.loggedBy.email } : null,
        pointsChange: c.points,
      });
    });

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningScore = 0;
    timeline = timeline.map((entry) => {
      runningScore += entry.pointsChange;
      return { ...entry, runningScore };
    });
    timeline.reverse();

    const memberData = member.toJSON();
    if (membership) {
      memberData.department = membership.department;
      memberData.position = membership.position;
      memberData.role = membership.role;
      memberData.status = membership.status;
      memberData.joiningDate = membership.joiningDate;
    }

    return res.status(200).json({
      member: memberData,
      stats: {
        attendanceCount,
        attendancePoints,
        attendancePercentage,
        contributionCount,
        contributionPoints,
        activityScore,
        calculatedStatus,
      },
      timeline,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/members/:id/status
 */
const updateMemberStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid member ID format' });
    }

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: formatZodError(parsed.error) });
    }

    const membership = await Membership.findOne({ user: id, society: req.society._id });
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found for this society' });
    }

    membership.status = parsed.data.status;
    await membership.save();

    return res.status(200).json({ message: `Membership status updated to "${membership.status}"`, membership });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMembers, getMemberById, updateMemberStatus };
