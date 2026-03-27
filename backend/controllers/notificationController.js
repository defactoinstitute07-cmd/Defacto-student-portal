const Student = require('../models/Student');
const { getMessaging } = require('../config/firebaseAdmin');
const { sendApiError } = require('../utils/apiError');

// Simple header-based admin guard to avoid exposing this to students accidentally.
// In production, prefer a proper Admin/Teacher auth flow.
const isAdminRequest = (req) => {
    const headerKey = req.header('x-admin-push-key');
    const expected = process.env.ADMIN_PUSH_API_KEY;
    return expected && headerKey && headerKey === expected;
};

exports.broadcastToAllStudents = async (req, res) => {
    try {
        if (!isAdminRequest(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden: invalid admin push key' });
        }

        const messaging = getMessaging();
        if (!messaging) {
            return res.status(503).json({ success: false, message: 'Push service is not configured on the server.' });
        }

        const { title, body, data } = req.body || {};

        if (!title || !body) {
            return res.status(400).json({ success: false, message: 'Both title and body are required.' });
        }

        const students = await Student.find({ deviceTokens: { $exists: true, $ne: [] } })
            .select('_id name rollNo deviceTokens')
            .lean();

        const tokens = Array.from(new Set(
            students.flatMap((s) => Array.isArray(s.deviceTokens) ? s.deviceTokens : [])
        ));

        if (tokens.length === 0) {
            return res.json({ success: true, sent: 0, skipped: 0, message: 'No registered student devices to notify.' });
        }

        const payload = {
            notification: { title, body },
            data: data && typeof data === 'object' ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [String(k), String(v)])
            ) : undefined,
            android: {
                priority: 'high'
            }
        };

        const BATCH_SIZE = 500; // FCM multicast limit
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            const chunk = tokens.slice(i, i + BATCH_SIZE);
            const response = await messaging.sendEachForMulticast({
                tokens: chunk,
                ...payload
            });

            successCount += response.successCount;
            failureCount += response.failureCount;
        }

        res.json({
            success: true,
            sent: successCount,
            failed: failureCount,
            totalDevices: tokens.length
        });
    } catch (error) {
        console.error('Error in broadcastToAllStudents:', error);
        sendApiError(res, error, 'Failed to send broadcast notification.');
    }
};

exports.sendToSpecificStudents = async (req, res) => {
    try {
        if (!isAdminRequest(req)) {
            return res.status(403).json({ success: false, message: 'Forbidden: invalid admin push key' });
        }

        const messaging = getMessaging();
        if (!messaging) {
            return res.status(503).json({ success: false, message: 'Push service is not configured on the server.' });
        }

        const { studentIds, title, body, data } = req.body || {};

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'studentIds (array of IDs) is required.' });
        }
        if (!title || !body) {
            return res.status(400).json({ success: false, message: 'Both title and body are required.' });
        }

        const students = await Student.find({ _id: { $in: studentIds } })
            .select('_id name rollNo deviceTokens')
            .lean();

        const tokens = Array.from(new Set(
            students.flatMap((s) => Array.isArray(s.deviceTokens) ? s.deviceTokens : [])
        ));

        if (tokens.length === 0) {
            return res.json({ success: true, sent: 0, skipped: studentIds.length, message: 'Selected students have no registered devices.' });
        }

        const payload = {
            notification: { title, body },
            data: data && typeof data === 'object' ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [String(k), String(v)])
            ) : undefined,
            android: {
                priority: 'high'
            }
        };

        const BATCH_SIZE = 500;
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            const chunk = tokens.slice(i, i + BATCH_SIZE);
            const response = await messaging.sendEachForMulticast({
                tokens: chunk,
                ...payload
            });

            successCount += response.successCount;
            failureCount += response.failureCount;
        }

        res.json({
            success: true,
            sent: successCount,
            failed: failureCount,
            totalDevices: tokens.length,
            targetedStudents: studentIds.length
        });
    } catch (error) {
        console.error('Error in sendToSpecificStudents:', error);
        sendApiError(res, error, 'Failed to send targeted notifications.');
    }
};
