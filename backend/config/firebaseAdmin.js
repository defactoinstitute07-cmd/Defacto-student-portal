const admin = require('firebase-admin');

let firebaseApp = null;

const initFirebaseAdmin = () => {
    if (firebaseApp) return firebaseApp;

    try {
        // Preferred: whole service account JSON in one env var
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        let credentialConfig;

        if (serviceAccountJson) {
            credentialConfig = JSON.parse(serviceAccountJson);
        } else {
            // Fallback: individual env vars
            const {
                FIREBASE_PROJECT_ID,
                FIREBASE_CLIENT_EMAIL,
                FIREBASE_PRIVATE_KEY,
                FIREBASE_PRIVATE_KEY_ID
            } = process.env;

            if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
                console.error('[firebaseAdmin] Missing Firebase service account env vars');
                return null;
            }

            credentialConfig = {
                project_id: FIREBASE_PROJECT_ID,
                client_email: FIREBASE_CLIENT_EMAIL,
                private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                private_key_id: FIREBASE_PRIVATE_KEY_ID
            };
        }

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(credentialConfig)
        });
    } catch (err) {
        console.error('[firebaseAdmin] Failed to initialize Firebase Admin:', err.message);
        firebaseApp = null;
    }

    return firebaseApp;
};

const getMessaging = () => {
    const app = initFirebaseAdmin();
    if (!app) return null;
    try {
        return admin.messaging(app);
    } catch (err) {
        console.error('[firebaseAdmin] Failed to get messaging instance:', err.message);
        return null;
    }
};

module.exports = {
	getMessaging
};
