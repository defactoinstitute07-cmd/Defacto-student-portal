import axios from 'axios';

const LEGACY_API_ORIGIN = 'https://student-erp-server-api.vercel.app';
const PRIMARY_API_ORIGIN = 'https://student.defactoinstitute.in';

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
        // In production builds, avoid relative /api to prevent frontend-only hosts
        // from returning "Server temporarily unavailable" during login.
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
    } catch (error) {
        if (!value.includes('/api')) {
            return value.endsWith('/') ? `${value}api` : `${value}/api`;
        }

        return value;
    }
};

const getBaseURL = () => {
    // During local development, always use Vite proxy so backend changes are testable
    // without depending on deployed API routes.
    if (import.meta.env.DEV) {
        return '/api';
    }

    const envBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

    if (shouldForcePublicApiOrigin(envBase)) {
        return normalizeBaseURL(PRIMARY_API_ORIGIN);
    }

    return normalizeBaseURL(envBase);
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 20000,
});

const normalizeAuthReason = (error) => {
    const rawReason = error?.response?.data?.error || error?.response?.data?.reason;
    if (!rawReason) return null;

    return String(rawReason).trim().toLowerCase().replace(/-/g, '_');
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('studentToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
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

        // Never intercept 401s from login endpoints — let the login page handle them
        const isLoginRequest = requestUrl.includes('/login') || requestUrl.includes('/register');

        if (statusCode === 401 && !isLoginRequest && !isLoginRoute && !authRedirectInProgress) {
            try {
                sessionStorage.setItem('auth_redirecting', '1');
            } catch {
                // no-op
            }
            localStorage.removeItem('studentToken');
            localStorage.removeItem('studentInfo');
            window.location.replace('/student/login');
        }

        return Promise.reject(error);
    }
);

export default api;
