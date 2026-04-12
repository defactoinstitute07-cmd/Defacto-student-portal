const { getMessaging } = require('../config/firebaseAdmin');

const INVALID_FCM_TOKEN_CODES = new Set([
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered'
]);

/**
 * Diagnostic endpoint to test direct FCM sending.
 * Bypasses database/student logic.
 */
exports.testDirectPush = async (req, res) => {
    try {
        const messaging = getMessaging();
        if (!messaging) {
            return res.status(503).json({ success: false, message: 'Push service is not configured on the server.' });
        }

        const { fcmToken, title, body, data } = req.body || {};

        if (!fcmToken) {
            return res.status(400).json({ success: false, message: 'fcmToken is required' });
        }

        const payload = {
            token: fcmToken,
            notification: {
                title: title || 'Test Notification',
                body: body || 'If you see this, your FCM setup is working!'
            },
            data: data && typeof data === 'object' ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [String(k), String(v)])
            ) : {
                type: 'diagnostic_test',
                timestamp: new Date().toISOString()
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'defacto_general'
                }
            }
        };

        console.log(`[FCM-TEST] Attempting direct push to token: ${fcmToken}`);
        
        const response = await messaging.send(payload);

        res.json({
            success: true,
            messageId: response,
            details: 'Message sent successfully to FCM. If it doesn\'t arrive on device, check project ID / token match.'
        });
    } catch (error) {
        console.error('[FCM-TEST] Error:', error);

        if (INVALID_FCM_TOKEN_CODES.has(error?.code)) {
            return res.status(410).json({
                success: false,
                message: 'Device token is invalid or expired. Ask the user to reopen the app so it can register a fresh notification token.',
                error: error.message,
                code: error.code
            });
        }

        res.status(500).json({
            success: false,
            message: 'FCM sending failed',
            error: error.message,
            code: error.code
        });
    }
};
