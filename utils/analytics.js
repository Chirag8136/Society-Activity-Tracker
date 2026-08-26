const mongoose = require('mongoose');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Contribution = require('../models/Contribution');

/**
 * Returns up to `limit` most recent "closed/past" events for the given society.
 */
const getRecentPastEvents = async (societyId, limit = 3) => {
  const now = new Date();
  const query = { $or: [{ date: { $lt: now } }, { isActive: false }] };
  if (societyId) query.society = societyId;

  return Event.find(query)
    .sort({ date: -1 })
    .limit(limit)
    .select('_id title eventType date points society');
};

/** Total count of past events for the given society. */
const getTotalPastEventsCount = async (societyId) => {
  const query = { date: { $lt: new Date() } };
  if (societyId) query.society = societyId;
  return Event.countDocuments(query);
};

const buildMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * Builds monthly trends scoped to a specific society.
 */
const getMonthlyTrends = async (societyId, monthsBack = 6) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

  const attendMatch = { checkInTime: { $gte: start } };
  const contribMatch = { date: { $gte: start } };

  if (societyId) {
    const sId = typeof societyId === 'string' ? new mongoose.Types.ObjectId(societyId) : societyId;
    attendMatch.society = sId;
    contribMatch.society = sId;
  }

  const [attendanceByMonth, contributionByMonth] = await Promise.all([
    Attendance.aggregate([
      { $match: attendMatch },
      {
        $group: {
          _id: { year: { $year: '$checkInTime' }, month: { $month: '$checkInTime' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Contribution.aggregate([
      { $match: contribMatch },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          count: { $sum: 1 },
          points: { $sum: '$points' },
        },
      },
    ]),
  ]);

  const attendanceMap = new Map(
    attendanceByMonth.map((e) => [`${e._id.year}-${String(e._id.month).padStart(2, '0')}`, e.count])
  );
  const contributionMap = new Map(
    contributionByMonth.map((e) => [`${e._id.year}-${String(e._id.month).padStart(2, '0')}`, e])
  );

  const trend = [];
  for (let i = 0; i < monthsBack; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = buildMonthKey(d);
    const contribEntry = contributionMap.get(key);
    trend.push({
      month: key,
      attendanceCount: attendanceMap.get(key) || 0,
      contributionCount: contribEntry ? contribEntry.count : 0,
      contributionPoints: contribEntry ? contribEntry.points : 0,
    });
  }
  return trend;
};

module.exports = { getRecentPastEvents, getTotalPastEventsCount, getMonthlyTrends, buildMonthKey };
