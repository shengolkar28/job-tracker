const prisma = require('../utils/prisma');

// All valid status values from the JobStatus enum
const ALL_STATUSES = ['applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted'];

// Statuses considered "no response" for responseRate calculation
const NO_RESPONSE_STATUSES = ['applied', 'ghosted'];

// Helper: round a number to N decimal places
const round = (value, decimals = 1) =>
  Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

// Helper: format a Date as a short week label e.g. "Jun 17"
const formatWeekLabel = (date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Helper: get the Monday (start of ISO week) for a given date
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon …
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ──────────── Summary ────────────

const getSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Run all independent queries in parallel
    const [totalApplications, statusGroups, thisWeekCount, respondedJobs] =
      await Promise.all([
        // 1. Total job count
        prisma.job.count({ where: { user_id: userId } }),

        // 2. Count per status
        prisma.job.groupBy({
          by: ['status'],
          where: { user_id: userId },
          _count: { status: true },
        }),

        // 3. Jobs applied in last 7 days
        prisma.job.count({
          where: {
            user_id: userId,
            applied_date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),

        // 4. Jobs that have moved past "applied" — used for avgDaysToResponse
        prisma.job.findMany({
          where: {
            user_id: userId,
            status: { notIn: ['applied'] },
          },
          select: { applied_date: true, last_updated: true },
        }),
      ]);

    // Build a status → count map
    const statusMap = {};
    for (const group of statusGroups) {
      statusMap[group.status] = group._count.status;
    }

    // Derived metrics
    const offerCount = statusMap['offer'] || 0;
    const respondedCount = ALL_STATUSES.filter(
      (s) => !NO_RESPONSE_STATUSES.includes(s)
    ).reduce((sum, s) => sum + (statusMap[s] || 0), 0);

    const offerRate =
      totalApplications > 0 ? round((offerCount / totalApplications) * 100) : 0;

    const responseRate =
      totalApplications > 0 ? round((respondedCount / totalApplications) * 100) : 0;

    // Average days between applied_date and last_updated for jobs past "applied"
    let avgDaysToResponse = 0;
    if (respondedJobs.length > 0) {
      const totalDays = respondedJobs.reduce((sum, job) => {
        const msPerDay = 1000 * 60 * 60 * 24;
        const days =
          (new Date(job.last_updated) - new Date(job.applied_date)) / msPerDay;
        return sum + Math.max(0, days); // guard against negative values
      }, 0);
      avgDaysToResponse = round(totalDays / respondedJobs.length);
    }

    return res.status(200).json({
      totalApplications,
      byStatus: statusMap,
      offerRate,
      responseRate,
      avgDaysToResponse,
      thisWeekCount,
    });
  } catch (error) {
    console.error('getSummary error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── By Status ────────────

const getByStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const groups = await prisma.job.groupBy({
      by: ['status'],
      where: { user_id: userId },
      _count: { status: true },
    });

    // Build a lookup so we can zero-fill missing statuses
    const countByStatus = {};
    for (const group of groups) {
      countByStatus[group.status] = group._count.status;
    }

    // Return every status, including those with 0 jobs
    const result = ALL_STATUSES.map((status) => ({
      status,
      count: countByStatus[status] || 0,
    }));

    return res.status(200).json({ byStatus: result });
  } catch (error) {
    console.error('getByStatus error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── By Week (last 12 weeks) ────────────

const getByWeek = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Calculate the Monday that started 12 weeks ago
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    const twelveWeeksAgo = new Date(currentWeekStart);
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 11 * 7); // 11 prior weeks + current = 12

    // Fetch only the applied_date for jobs within the window
    const jobs = await prisma.job.findMany({
      where: {
        user_id: userId,
        applied_date: { gte: twelveWeeksAgo },
      },
      select: { applied_date: true },
    });

    // Build ordered array of the 12 week-start dates
    const weeks = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(twelveWeeksAgo);
      weekStart.setDate(twelveWeeksAgo.getDate() + i * 7);
      weeks.push({ start: weekStart, count: 0 });
    }

    // Bucket each job into its corresponding week
    for (const job of jobs) {
      const weekStart = getWeekStart(new Date(job.applied_date));
      const weekIndex = Math.round(
        (weekStart - twelveWeeksAgo) / (7 * 24 * 60 * 60 * 1000)
      );
      if (weekIndex >= 0 && weekIndex < 12) {
        weeks[weekIndex].count += 1;
      }
    }

    const result = weeks.map(({ start, count }) => ({
      week: formatWeekLabel(start),
      count,
    }));

    return res.status(200).json({ byWeek: result });
  } catch (error) {
    console.error('getByWeek error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── By Company (top 10) ────────────

const getByCompany = async (req, res) => {
  try {
    const userId = req.user.userId;

    const groups = await prisma.job.groupBy({
      by: ['company'],
      where: { user_id: userId },
      _count: { company: true },
      orderBy: { _count: { company: 'desc' } },
      take: 10,
    });

    const result = groups.map((g) => ({
      company: g.company,
      count: g._count.company,
    }));

    return res.status(200).json({ byCompany: result });
  } catch (error) {
    console.error('getByCompany error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getSummary, getByStatus, getByWeek, getByCompany };
