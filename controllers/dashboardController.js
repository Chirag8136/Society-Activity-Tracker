const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Contribution = require('../models/Contribution');
const Membership = require('../models/Membership');
const { computeCalculatedStatus, ACTIVITY_STATUS } = require('../utils/scoring');
const { getRecentPastEvents, getMonthlyTrends } = require('../utils/analytics');

const toIdMap = (arr) => new Map(arr.map((entry) => [entry._id.toString(), entry]));

/**
 * GET /api/dashboard/stats (admin only for active society)
 */
const getStats = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ society: req.society._id, status: 'active' }).populate('user');
    const validMemberships = memberships.filter((m) => m.user);
    const memberUserIds = validMemberships.map((m) => m.user._id);
    const totalMembers = validMemberships.length;

    const recentEvents = await getRecentPastEvents(req.society._id, 3);
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

    const statusCounts = { [ACTIVITY_STATUS.ACTIVE]: 0, [ACTIVITY_STATUS.LOW_ACTIVITY]: 0, [ACTIVITY_STATUS.INACTIVE]: 0 };

    const scoredMembers = validMemberships.map((membership) => {
      const u = membership.user;
      const idStr = u._id.toString();
      const attendance = attendanceMap.get(idStr) || { attendanceCount: 0, attendancePoints: 0 };
      const contribution = contributionMap.get(idStr) || { contributionCount: 0, contributionPoints: 0 };
      const windowAttendedCount = (windowAttendanceMap.get(idStr) || { attendedCount: 0 }).attendedCount;
      const windowContributions = (windowContributionMap.get(idStr) || { contributions: [] }).contributions;

      const activityScore = attendance.attendancePoints + contribution.contributionPoints;
      const calculatedStatus = computeCalculatedStatus({
        attendedCount: windowAttendedCount,
        windowContributions,
        hasPastEvents: recentEvents.length > 0,
      });
      statusCounts[calculatedStatus] += 1;

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        department: membership.department,
        position: membership.position,
        activityScore,
        calculatedStatus,
      };
    });

    const topMembers = [...scoredMembers].sort((a, b) => b.activityScore - a.activityScore).slice(0, 5);

    let recentAttendanceRate = 0;
    if (recentEvents.length > 0 && totalMembers > 0) {
      const perEventAttendeeCounts = await Promise.all(
        recentEvents.map((event) => Attendance.countDocuments({ event: event._id, user: { $in: memberUserIds } }))
      );
      const rateSum = perEventAttendeeCounts.reduce((sum, count) => sum + (count / totalMembers) * 100, 0);
      recentAttendanceRate = Math.round((rateSum / recentEvents.length) * 10) / 10;
    }

    const recentContributions = await Contribution.find({ society: req.society._id })
      .sort({ date: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('loggedBy', 'name email');

    const monthlyTrends = await getMonthlyTrends(req.society._id, 6);

    return res.status(200).json({
      society: {
        _id: req.society._id,
        name: req.society.name,
        code: req.society.code,
        joinCode: req.society.joinCode,
        category: req.society.category,
      },
      totalMembers,
      statusCounts,
      recentAttendanceRate,
      recentEventsConsidered: recentEvents.map((e) => ({ id: e._id, title: e.title, date: e.date })),
      topMembers,
      recentContributions,
      monthlyTrends,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
