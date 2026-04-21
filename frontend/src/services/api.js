import axios from 'axios';

const LEGACY_API_ORIGIN = 'https://student-erp-server-api.vercel.app';
const PRIMARY_API_ORIGIN = 'https://defacto-student-portal.vercel.app';

const STORAGE_KEYS = {
    token: 'studentToken',
    refreshToken: 'studentRefreshToken',
    studentInfo: 'studentInfo',
    accessTokenExpiresAt: 'studentAccessTokenExpiresAt',
    loginTimestamp: 'loginTimestamp'
};

const isPrivateOrLocalHost = (hostname = '') => {
    const host = String(hostname || '').trim().toLowerCase();
    if (!host) return false;

    if (host === 'localhost' || host === '0.0.0.0' || host.endsWith('.local')) {
        return true;
    }

    if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) {
        return true;
    }

    const match172 = host.match(/^172\.(\d{1,3})\./);
    if (match172) {
        const secondOctet = Number(match172[1]);
        if (secondOctet >= 16 && secondOctet <= 31) {
            return true;
        }
    }

    return false;
};

const shouldForcePublicApiOrigin = (rawBase) => {
    const value = String(rawBase || '').trim();
    if (!value.startsWith('http')) return false;

    try {
        const url = new URL(value);
        if (!isPrivateOrLocalHost(url.hostname)) {
            return false;
        }

        const appHost = typeof window !== 'undefined' ? window.location.hostname : '';
        return !isPrivateOrLocalHost(appHost);
    } catch {
        return false;
    }
};

const normalizeBaseURL = (rawBase) => {
    const value = String(rawBase || '').trim();
    if (!value) {
        return import.meta.env.DEV ? '/api' : `${PRIMARY_API_ORIGIN}/api`;
    }
    if (!value.startsWith('http')) return value;

    try {
        const url = new URL(value);

        if (url.origin === LEGACY_API_ORIGIN) {
            const target = new URL(PRIMARY_API_ORIGIN);
            url.protocol = target.protocol;
            url.host = target.host;
        }

        if (!url.pathname.startsWith('/api')) {
            url.pathname = `${url.pathname.replace(/\/+$/, '')}/api`;
        }

        return url.toString().replace(/\/$/, '');
    } catch {
        if (!value.includes('/api')) {
            return value.endsWith('/') ? `${value}api` : `${value}/api`;
        }

        return value;
    }
};

const getBaseURL = () => {
    if (import.meta.env.DEV) {
        return '/api';
    }

    const appHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const storedIP = typeof window !== 'undefined' ? localStorage.getItem('local_dev_ip_override') : null;

    if (storedIP) {
        return `http://${storedIP}:5005/api`;
    }

    const envBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

    if (isPrivateOrLocalHost(appHost)) {
        if (envBase) {
            try {
                const url = new URL(envBase);
                if (isPrivateOrLocalHost(url.hostname)) {
                    return normalizeBaseURL(envBase);
                }
            } catch {
                // Ignore parsing errors
            }
        }

        const targetHost = appHost === 'localhost' ? '127.0.0.1' : appHost;
        return `http://${targetHost}:5005/api`;
    }

    if (shouldForcePublicApiOrigin(envBase)) {
        return normalizeBaseURL(PRIMARY_API_ORIGIN);
    }

    return normalizeBaseURL(envBase);
};

const safeStorage = {
    getItem(key) {
        if (typeof window === 'undefined') return null;
        try {
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem(key, value) {
        if (typeof window === 'undefined' || value === undefined || value === null) return;
        try {
            window.localStorage.setItem(key, value);
        } catch {
            // Ignore storage failures
        }
    },
    removeItem(key) {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.removeItem(key);
        } catch {
            // Ignore storage failures
        }
    }
};

const parseStoredStudent = () => {
    const rawStudent = safeStorage.getItem(STORAGE_KEYS.studentInfo);
    if (!rawStudent) return null;

    try {
        return JSON.parse(rawStudent);
    } catch {
        return null;
    }
};

const decodeJwtExpiry = (token) => {
    const rawToken = String(token || '').trim();
    if (!rawToken) return null;

    try {
        const [, payload] = rawToken.split('.');
        if (!payload) return null;

        const normalized = payload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(payload.length / 4) * 4, '=');

        const decoded = JSON.parse(atob(normalized));
        return decoded?.exp ? decoded.exp * 1000 : null;
    } catch {
        return null;
    }
};

const resolveStoredExpiryMs = (token) => {
    const rawExpiry = safeStorage.getItem(STORAGE_KEYS.accessTokenExpiresAt);
    if (rawExpiry) {
        const parsed = Date.parse(rawExpiry);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return decodeJwtExpiry(token);
};

const normalizeAuthReason = (error) => {
    const rawReason = error?.response?.data?.error || error?.response?.data?.reason;
    if (!rawReason) return null;

    return String(rawReason).trim().toLowerCase().replace(/-/g, '_');
};

const isAuthRequest = (requestUrl = '') => /\/student\/(?:mobile\/)?(?:login|refresh|logout|register)/i.test(String(requestUrl || ''));

const isTerminalRefreshFailure = (error) => {
    const statusCode = error?.response?.status;
    const authReason = normalizeAuthReason(error);

    return statusCode === 401
        || statusCode === 403
        || ['session_expired', 'token_invalid', 'token_missing'].includes(authReason);
};

export const getStoredAccessToken = () => safeStorage.getItem(STORAGE_KEYS.token);
export const getStoredRefreshToken = () => safeStorage.getItem(STORAGE_KEYS.refreshToken);
export const getStoredStudentInfo = () => parseStoredStudent();

export const clearAuthSession = () => {
    safeStorage.removeItem(STORAGE_KEYS.token);
    safeStorage.removeItem(STORAGE_KEYS.refreshToken);
    safeStorage.removeItem(STORAGE_KEYS.studentInfo);
    safeStorage.removeItem(STORAGE_KEYS.accessTokenExpiresAt);
    safeStorage.removeItem(STORAGE_KEYS.loginTimestamp);
};

export const saveAuthSession = ({
    token,
    refreshToken,
    student,
    accessTokenExpiresAt
} = {}) => {
    const existingStudent = parseStoredStudent() || {};
    const mergedStudent = student === undefined
        ? existingStudent
        : {
            ...existingStudent,
            ...student
        };

    if (token) {
        safeStorage.setItem(STORAGE_KEYS.token, token);
    }

    if (typeof refreshToken === 'string' && refreshToken.trim()) {
        safeStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken.trim());
    }

    if (student !== undefined) {
        safeStorage.setItem(STORAGE_KEYS.studentInfo, JSON.stringify(mergedStudent));
    }

    const resolvedExpiryMs = accessTokenExpiresAt
        ? Date.parse(accessTokenExpiresAt)
        : decodeJwtExpiry(token || getStoredAccessToken());

    if (Number.isFinite(resolvedExpiryMs)) {
        safeStorage.setItem(
            STORAGE_KEYS.accessTokenExpiresAt,
            new Date(resolvedExpiryMs).toISOString()
        );
    }
};

const shouldRefreshAccessToken = (token, skewMs = 30_000) => {
    if (!token) return false;

    const expiryMs = resolveStoredExpiryMs(token);
    if (!Number.isFinite(expiryMs)) {
        return false;
    }

    return Date.now() >= (expiryMs - skewMs);
};

const buildRefreshPayload = () => ({
    refreshToken: getStoredRefreshToken(),
    platform: 'web',
    appType: 'web',
    appVersion: 'web',
    deviceId: typeof navigator !== 'undefined' ? navigator.userAgent : 'browser',
    model: typeof navigator !== 'undefined' ? navigator.platform || 'browser' : 'browser',
    manufacturer: 'browser'
});

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 60000,
});

const refreshClient = axios.create({
    baseURL: getBaseURL(),
    timeout: 60000,
});

let refreshPromise = null;

const refreshStudentSession = async () => {
    const existingRefreshToken = getStoredRefreshToken();
    if (!existingRefreshToken) {
        throw new Error('refresh_token_missing');
    }

    if (!refreshPromise) {
        refreshPromise = refreshClient.post('/student/refresh', buildRefreshPayload())
            .then((response) => {
                if (!response?.data?.success || !response?.data?.token) {
                    throw new Error('refresh_failed');
                }

                saveAuthSession({
                    token: response.data.token,
                    refreshToken: response.data.refreshToken || existingRefreshToken,
                    student: response.data.student,
                    accessTokenExpiresAt: response.data.accessTokenExpiresAt
                });

                return response.data;
            })
            .catch((error) => {
                if (isTerminalRefreshFailure(error)) {
                    clearAuthSession();
                }
                throw error;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

export const ensureFreshStudentSession = async () => {
    const token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
        return token;
    }

    if (!token || shouldRefreshAccessToken(token)) {
        await refreshStudentSession();
        return getStoredAccessToken();
    }

    return token;
};

api.interceptors.request.use(async (config) => {
    const nextConfig = { ...config };
    nextConfig.headers = nextConfig.headers || {};

    if (!nextConfig.skipAuthRefresh && !isAuthRequest(nextConfig.url)) {
        try {
            await ensureFreshStudentSession();
        } catch {
            // Let the protected request fail and be handled by the response interceptor.
        }
    }

    const token = getStoredAccessToken();
    if (token) {
        nextConfig.headers.Authorization = `Bearer ${token}`;
    }

    return nextConfig;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const statusCode = error.response?.status;
        const requestUrl = error?.config?.url || '';
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isLoginRoute = currentPath.startsWith('/student/login');
        const authRedirectInProgress = typeof window !== 'undefined'
            ? sessionStorage.getItem('auth_redirecting') === '1'
            : false;

        if (statusCode === 401 && !isAuthRequest(requestUrl) && !error?.config?._retry) {
            const authReason = normalizeAuthReason(error);
            const canRetryWithRefresh = !!getStoredRefreshToken()
                && (!authReason || ['session_expired', 'token_invalid', 'token_missing'].includes(authReason));

            if (canRetryWithRefresh) {
                try {
                    error.config._retry = true;
                    await refreshStudentSession();
                    error.config.headers = error.config.headers || {};
                    error.config.headers.Authorization = `Bearer ${getStoredAccessToken()}`;
                    return api(error.config);
                } catch (refreshError) {
                    if (!isTerminalRefreshFailure(refreshError)) {
                        return Promise.reject(refreshError);
                    }
                    // Fall through to the redirect handler below.
                }
            }
        }

        if (statusCode === 401 && !isAuthRequest(requestUrl) && !isLoginRoute && !authRedirectInProgress) {
            try {
                sessionStorage.setItem('auth_redirecting', '1');
            } catch {
                // no-op
            }
            clearAuthSession();
            window.location.replace('/student/login');
        }

        return Promise.reject(error);
    }
);

export default api;
