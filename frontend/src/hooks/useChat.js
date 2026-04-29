/**
 * useChat — Real-time Socket.io hook for the Chat module
 *
 * NOTE: Project uses Vite, so env vars must be prefixed VITE_*
 *       (REACT_APP_* is CRA-only and won't work here).
 *       Set VITE_SOCKET_URL in your .env file.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getStoredAccessToken } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '';

const useChat = () => {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    /* ── Initialize socket on mount ── */
    useEffect(() => {
        const token = getStoredAccessToken();

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            autoConnect: true,
        });

        const socket = socketRef.current;

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on('connect_error', (err) => {
            console.error('[useChat] Connection error:', err.message);
            setConnected(false);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, []);

    /* ── joinRoom — user ka room join kare ── */
    const joinRoom = useCallback((userId) => {
        socketRef.current?.emit('joinRoom', { userId });
    }, []);

    /* ── sendMessage — emit 'sendMessage' event ── */
    const sendMessage = useCallback((data) => {
        socketRef.current?.emit('sendMessage', data);
    }, []);

    /* ── onNewMessage — listen for 'newMessage' ── */
    const onNewMessage = useCallback((callback) => {
        const socket = socketRef.current;
        if (!socket) return () => {};

        socket.on('newMessage', callback);
        return () => socket.off('newMessage', callback);
    }, []);

    /* ── onSeenUpdate — listen for 'messageSeenUpdate' ── */
    const onSeenUpdate = useCallback((callback) => {
        const socket = socketRef.current;
        if (!socket) return () => {};

        socket.on('messageSeenUpdate', callback);
        return () => socket.off('messageSeenUpdate', callback);
    }, []);

    return { joinRoom, sendMessage, onNewMessage, onSeenUpdate, connected };
};

export default useChat;
