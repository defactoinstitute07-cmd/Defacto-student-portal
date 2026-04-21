const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const DEFAULT_MOBILE_ACCESS_TTL = process.env.MOBILE_ACCESS_TOKEN_TTL || '15m';
const DEFAULT_WEB_ACCESS_TTL = process.env.WEB_ACCESS_TOKEN_TTL || '1h';
const DEFAULT_SETUP_ACCESS_TOKEN_TTL = process.env.SETUP_ACCESS_TOKEN_TTL || '2h';
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

const resolveAccessTtl = (student, options = {}) => {
    if (options.accessTtl) {
        return options.accessTtl;
    }

    if (options.client === 'web') {
        return (student?.isFirstLogin || !student?.profileImage)
            ? DEFAULT_SETUP_ACCESS_TOKEN_TTL
            : DEFAULT_WEB_ACCESS_TTL;
    }

    return DEFAULT_MOBILE_ACCESS_TTL;
};

const createAccessToken = (student, options = {}) => {
    const payload = {
        id: student._id,
        rollNo: student.rollNo,
        name: student.name,
        client: options.client || 'mobile'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: resolveAccessTtl(student, options)
    });
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

const issueStudentSession = async (student, deviceInfo = {}, existingSessionId = null, options = {}) => {
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

    const accessToken = createAccessToken(student, options);
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

const refreshStudentSession = async (student, refreshToken, deviceInfo = {}, existingSessionId = null, options = {}) => {
    const now = new Date();
    pruneMobileRefreshSessions(student, now);

    const existingSession = existingSessionId
        ? student.mobileRefreshSessions.id(existingSessionId)
        : student.mobileRefreshSessions.find((session) => session.tokenHash === hashRefreshToken(refreshToken));

    if (!existingSession || existingSession.expiresAt <= now) {
        throw new Error('refresh_session_invalid');
    }

    existingSession.lastUsedAt = now;

    const normalizedDevice = normalizeDeviceInfo(deviceInfo);
    if (Object.values(normalizedDevice).some(Boolean)) {
        existingSession.device = normalizedDevice;
    }

    student.mobileRefreshSessions = student.mobileRefreshSessions
        .sort((left, right) => right.lastUsedAt.getTime() - left.lastUsedAt.getTime())
        .slice(0, Math.max(DEFAULT_SESSION_LIMIT, 1));

    await student.save();

    const accessToken = createAccessToken(student, options);
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

const issueMobileSession = async (student, deviceInfo = {}, existingSessionId = null, options = {}) => (
    issueStudentSession(student, deviceInfo, existingSessionId, {
        client: 'mobile',
        ...options
    })
);

module.exports = {
    buildStudentLoginResponse,
    hashRefreshToken,
    issueStudentSession,
    issueMobileSession,
    refreshStudentSession,
    normalizeDeviceInfo,
    pruneMobileRefreshSessions
};
