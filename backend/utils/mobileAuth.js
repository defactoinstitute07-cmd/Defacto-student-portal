const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const DEFAULT_ACCESS_TTL = process.env.MOBILE_ACCESS_TOKEN_TTL || '15m';
const DEFAULT_REFRESH_DAYS = parseInt(process.env.MOBILE_REFRESH_TOKEN_DAYS || '30', 10);
const DEFAULT_SESSION_LIMIT = parseInt(process.env.MOBILE_REFRESH_SESSION_LIMIT || '5', 10);

const normalizeDeviceInfo = (payload = {}) => ({
    platform: String(payload.platform || '').trim(),
    model: String(payload.model || '').trim(),
    manufacturer: String(payload.manufacturer || '').trim(),
    appVersion: String(payload.appVersion || '').trim(),
    deviceId: String(payload.deviceId || '').trim(),
    appType: String(payload.appType || '').trim(),
    packageName: String(payload.packageName || '').trim()
});

const buildStudentLoginResponse = (student) => {
    const needsSetup = student.isFirstLogin || !student.profileImage;

    return {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        class: student.className,
        batch: student.batchId ? student.batchId.name : 'N/A',
        isFirstLogin: student.isFirstLogin,
        profileImage: student.profileImage || null,
        needsSetup
    };
};

const createAccessToken = (student) => {
    const payload = {
        id: student._id,
        rollNo: student.rollNo,
        name: student.name,
        client: 'mobile'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: DEFAULT_ACCESS_TTL });
};

const decodeExpiry = (token) => {
    const decoded = jwt.decode(token);
    return decoded?.exp ? new Date(decoded.exp * 1000) : null;
};

const createRefreshToken = () => crypto.randomBytes(48).toString('hex');

const hashRefreshToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const pruneMobileRefreshSessions = (student, now = new Date()) => {
    student.mobileRefreshSessions = (student.mobileRefreshSessions || [])
        .filter((session) => session.expiresAt && session.expiresAt > now)
        .sort((left, right) => right.lastUsedAt.getTime() - left.lastUsedAt.getTime());
};

const getRefreshTokenExpiry = (now = new Date()) => {
    const refreshDays = Number.isFinite(DEFAULT_REFRESH_DAYS) && DEFAULT_REFRESH_DAYS > 0
        ? DEFAULT_REFRESH_DAYS
        : 30;

    return new Date(now.getTime() + refreshDays * 24 * 60 * 60 * 1000);
};

const issueMobileSession = async (student, deviceInfo = {}, existingSessionId = null) => {
    const now = new Date();
    pruneMobileRefreshSessions(student, now);

    const refreshToken = createRefreshToken();
    const refreshSession = {
        tokenHash: hashRefreshToken(refreshToken),
        device: normalizeDeviceInfo(deviceInfo),
        issuedAt: now,
        lastUsedAt: now,
        expiresAt: getRefreshTokenExpiry(now)
    };

    if (existingSessionId) {
        const existingSession = student.mobileRefreshSessions.id(existingSessionId);
        if (existingSession) {
            existingSession.tokenHash = refreshSession.tokenHash;
            existingSession.device = refreshSession.device;
            existingSession.issuedAt = refreshSession.issuedAt;
            existingSession.lastUsedAt = refreshSession.lastUsedAt;
            existingSession.expiresAt = refreshSession.expiresAt;
        } else {
            student.mobileRefreshSessions.push(refreshSession);
        }
    } else {
        student.mobileRefreshSessions.push(refreshSession);
    }

    student.mobileRefreshSessions = student.mobileRefreshSessions
        .sort((left, right) => right.lastUsedAt.getTime() - left.lastUsedAt.getTime())
        .slice(0, Math.max(DEFAULT_SESSION_LIMIT, 1));

    await student.save();

    const accessToken = createAccessToken(student);
    const accessTokenExpiresAt = decodeExpiry(accessToken);

    return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        expiresInSeconds: accessTokenExpiresAt
            ? Math.max(Math.floor((accessTokenExpiresAt.getTime() - now.getTime()) / 1000), 0)
            : 0
    };
};

module.exports = {
    buildStudentLoginResponse,
    hashRefreshToken,
    issueMobileSession,
    normalizeDeviceInfo,
    pruneMobileRefreshSessions
};
