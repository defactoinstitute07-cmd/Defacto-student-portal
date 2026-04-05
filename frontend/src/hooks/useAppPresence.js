import { useEffect, useRef } from 'react';
import api from '../services/api';

const ACTIVITY_PING_MS = 2 * 60 * 1000;

export const useAppPresence = () => {
    const startedRef = useRef(false);

    useEffect(() => {
        let intervalId = null;
        let visibilityHandler = null;
        let tokenWatcher = null;

        const sendActivity = async (event) => {
            try {
                await api.post('/student/activity', { event });
            } catch {
                // Ignore background errors
            }
        };

        const startPresence = () => {
            if (startedRef.current) return;
            const token = localStorage.getItem('studentToken');
            if (!token) return;

            startedRef.current = true;
            sendActivity('app_open');

            intervalId = setInterval(() => sendActivity('heartbeat'), ACTIVITY_PING_MS);

            visibilityHandler = () => {
                if (document.visibilityState === 'visible') {
                    sendActivity('app_open');
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
        };

        startPresence();

        if (!startedRef.current) {
            tokenWatcher = setInterval(() => {
                if (!startedRef.current) startPresence();
                if (startedRef.current && tokenWatcher) {
                    clearInterval(tokenWatcher);
                }
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (tokenWatcher) clearInterval(tokenWatcher);
            if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
        };
    }, []);
};
