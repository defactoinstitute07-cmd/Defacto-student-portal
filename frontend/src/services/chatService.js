/**
 * Chat Service — API layer for the Chat module
 *
 * NOTE: We import the shared `api` axios instance which already
 *       handles JWT (Authorization header), token refresh, and
 *       base URL resolution (via VITE_API_BASE_URL / VITE_API_URL).
 *       No need to duplicate that logic here.
 */

import api from './api';

/* ─────────────────────────────────────────────
   1. GET  /chat/conversations/:userId
      → Fetch all conversations for a user
   ───────────────────────────────────────────── */
export const getConversations = async (userId) => {
    const { data } = await api.get(`/chat/conversations/${userId}`);
    return data;
};

/* ─────────────────────────────────────────────
   2. GET  /chat/messages/:otherUserId
      → Fetch message thread with another user
   ───────────────────────────────────────────── */
export const getMessages = async (userId, otherUserId) => {
    const { data } = await api.get(`/chat/messages/${otherUserId}`, {
        params: { userId },
    });
    return data;
};

/* ─────────────────────────────────────────────
   3. PATCH  /chat/seen/:senderId
      → Mark all messages from a sender as seen
   ───────────────────────────────────────────── */
export const markSeen = async (senderId) => {
    const { data } = await api.patch(`/chat/seen/${senderId}`);
    return data;
};

/* ─────────────────────────────────────────────
   4. POST  /chat/send
      → Send a new message
   ───────────────────────────────────────────── */
export const sendMessage = async (to, text) => {
    const { data } = await api.post('/chat/send', { to, text });
    return data;
};
