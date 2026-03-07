import axios from 'axios';

const getBaseURL = () => {
    const envBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
    if (!envBase) return '/api';

    // If it's a full URL and doesn't end with /api, append it
    if (envBase.startsWith('http') && !envBase.includes('/api')) {
        return envBase.endsWith('/') ? `${envBase}api` : `${envBase}/api`;
    }
    return envBase;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('studentToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
