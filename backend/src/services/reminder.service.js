'use strict';

const cron                              = require('node-cron');
const prisma                            = require('../utils/prisma');
const { sendReminderEmail }             = require('./email.service');

// ──────────── Stale threshold ─────────────────────────────────────────────────
const STALE_DAYS = 7;

// Statuses that mean the application is closed — no reminder needed
const CLOSED_STATUSES = ['offer', 'rejected', 'ghosted'];

// ──────────── Core logic ──────────────────────────────────────────────────────
const processReminders = async () => {
  console.log('[Reminder] Running stale-application check…');

  try {
    // Find all users who have reminders enabled
    const users = await prisma.user.findMany({
      where: { reminder_enabled: true },
      select: { id: true, name: true, email: true },
    });

    if (users.length === 0) {
      console.log('[Reminder] No users with reminders enabled.');
      return;
    }

    const staleThreshold = new Date(Date.now() - STALE_DAYS * 86_400_000);
    let emailsSent = 0;

    for (const user of users) {
      try {
        // Find jobs not updated in >7 days and not in a closed status
        const staleJobs = await prisma.job.findMany({
          where: {
            user_id: user.id,
            last_updated: { lt: staleThreshold },
            status: { notIn: CLOSED_STATUSES },
          },
          select: {
            company:      true,
            role:         true,
            status:       true,
            last_updated: true,
          },
          orderBy: { last_updated: 'asc' },
        });

        if (staleJobs.length === 0) continue;

        await sendReminderEmail(user, staleJobs);
        emailsSent += 1;
        console.log(
          `[Reminder] Sent reminder to ${user.email} — ${staleJobs.length} stale job(s).`
        );
      } catch (userErr) {
        // Never crash the cron — log per-user errors and continue
        console.error(`[Reminder] Failed to process user ${user.email}:`, userErr.message);
      }
    }

    console.log(`[Reminder] Done. Emails sent: ${emailsSent}`);
  } catch (err) {
    console.error('[Reminder] Cron job error:', err.message);
  }
};

// ──────────── startReminderCron ───────────────────────────────────────────────
/**
 * Register the reminder cron schedule and start it.
 * Call this once after the server starts listening.
 */
const startReminderCron = () => {
  // Production schedule — every day at 9:00 AM
  cron.schedule('0 9 * * *', processReminders, {
    timezone: 'Asia/Kolkata',
  });

  // Testing schedule — runs every minute (uncomment to enable for local testing)
  // cron.schedule('* * * * *', processReminders);

  console.log('[Reminder] Cron job scheduled — daily at 09:00.');
};

module.exports = { startReminderCron };
