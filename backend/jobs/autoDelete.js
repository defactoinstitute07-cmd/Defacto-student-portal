/**
 * Auto-Delete Job — Purge seen messages after 24 hours
 *
 * Uses node-cron to run every hour.
 * Soft-deletes (sets deleted = true) messages where:
 *   - seenAt is NOT null
 *   - seenAt is older than 24 hours (86400000 ms)
 *   - deleted is still false
 *
 * Call startAutoDeleteJob() once from server.js to activate.
 */

const cron = require('node-cron');
const Message = require('../models/Message');

const TWENTY_FOUR_HOURS_MS = 86400000;

const runAutoDelete = async () => {
    try {
        const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

        const result = await Message.updateMany(
            {
                seenAt: { $ne: null, $lt: cutoff },
                deleted: false
            },
            { $set: { deleted: true } }
        );

        if (result.modifiedCount > 0) {
            console.log(`[autoDelete] Soft-deleted ${result.modifiedCount} expired messages.`);
        }
    } catch (error) {
        console.error('[autoDelete] Error:', error.message);
    }
};

/**
 * Start the cron job — runs every hour at minute 0.
 * Safe to call multiple times (idempotent via cron.schedule).
 */
const startAutoDeleteJob = () => {
    // '0 * * * *' = at minute 0 of every hour
    cron.schedule('0 * * * *', runAutoDelete, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
    });

    console.log('[autoDelete] Cron job scheduled — runs every hour.');
};

module.exports = { startAutoDeleteJob, runAutoDelete };
