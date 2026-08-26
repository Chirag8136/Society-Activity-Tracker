/**
 * utils/scoring.js
 *
 * Central place for the scoring/inactivity business rules so they aren't
 * duplicated across memberController and dashboardController.
 *
 * Point values (for reference — actual points are read from each record,
 * not hardcoded here, since Event.points and Contribution.points already
 * store the real value per the Phase 1/3 models):
 *   Meeting attendance        = +5 pts   (Event.points, meeting-type events)
 *   Event/Workshop attendance = +10 pts  (Event.points, event-type events)
 *   Minor contribution        = +5 pts
 *   Major contribution        = +15 pts
 *
 * Contributions don't have an explicit "minor/major" field in the schema —
 * classification is derived from `points` using the thresholds below, which
 * mirror the values given in the spec (minor=5, major=15). Anything below
 * MAJOR_CONTRIBUTION_MIN_POINTS is treated as "minor".
 */

const ACTIVITY_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  LOW_ACTIVITY: 'LOW ACTIVITY',
  INACTIVE: 'INACTIVE',
});

const MAJOR_CONTRIBUTION_MIN_POINTS = 15;

/** @returns {'minor'|'major'} */
const classifyContribution = (points) => (points >= MAJOR_CONTRIBUTION_MIN_POINTS ? 'major' : 'minor');

/**
 * Applies the Inactivity Detection Rule.
 *
 * @param {Object} params
 * @param {number} params.attendedCount        How many of the last 3 closed/past events this member attended.
 * @param {{points:number}[]} params.windowContributions  Contributions logged within the same recent-events timeframe.
 * @param {boolean} [params.hasPastEvents=true] Whether any closed/past events exist at all yet.
 *        When there is no event history to judge against (a brand-new society),
 *        we default to ACTIVE rather than punishing everyone as INACTIVE —
 *        this is a deliberate extension beyond the literal rule for a sane
 *        empty-state; it only kicks in when there is truly no history.
 * @returns {'ACTIVE'|'LOW ACTIVITY'|'INACTIVE'}
 */
const computeCalculatedStatus = ({ attendedCount, windowContributions, hasPastEvents = true }) => {
  if (!hasPastEvents) {
    return ACTIVITY_STATUS.ACTIVE;
  }

  const contributionsCount = windowContributions.length;

  // Rule 1: zero attendance AND zero contributions in the window -> INACTIVE
  if (attendedCount === 0 && contributionsCount === 0) {
    return ACTIVITY_STATUS.INACTIVE;
  }

  // Rule 2: attended exactly 1 event, OR made exactly 1 MINOR contribution -> LOW ACTIVITY
  const madeExactlyOneMinorContribution =
    contributionsCount === 1 && classifyContribution(windowContributions[0].points) === 'minor';

  if (attendedCount === 1 || madeExactlyOneMinorContribution) {
    return ACTIVITY_STATUS.LOW_ACTIVITY;
  }

  // Rule 3: everything else -> ACTIVE
  return ACTIVITY_STATUS.ACTIVE;
};

module.exports = {
  ACTIVITY_STATUS,
  MAJOR_CONTRIBUTION_MIN_POINTS,
  classifyContribution,
  computeCalculatedStatus,
};
