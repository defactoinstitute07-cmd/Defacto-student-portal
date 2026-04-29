import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations, getMessages, sendMessage, markSeen } from '../services/chatService';
import {
    Search, Send, ArrowLeft, CheckCheck, Clock, Trash2,
    MessageCircle, ChevronRight, Circle, ShieldCheck
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) return time;
    if (isYesterday) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
};

const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
};

const AVATAR_COLORS = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-sky-600',
];

const pickColor = (id = '') => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* ─────────────────────────────────────────────
   Countdown Hook — "Deletes in Xh Xm"
   ───────────────────────────────────────────── */

const useCountdown = (expiresAt) => {
    const [remaining, setRemaining] = useState('');

    useEffect(() => {
        if (!expiresAt) { setRemaining(''); return; }

        const tick = () => {
            const diff = new Date(expiresAt) - Date.now();
            if (diff <= 0) { setRemaining('Expired'); return; }

            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m`);
        };

        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return remaining;
};

/* ─────────────────────────────────────────────
   CountdownBadge (used per-message)
   ───────────────────────────────────────────── */

const CountdownBadge = ({ expiresAt }) => {
    const remaining = useCountdown(expiresAt);
    if (!remaining) return null;

    return (
        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
            <Clock size={10} strokeWidth={2.5} />
            Deletes in {remaining}
        </span>
    );
};

/* ─────────────────────────────────────────────
   Single Message Bubble
   ───────────────────────────────────────────── */

const MessageBubble = ({ msg, isSent }) => {
    if (msg.deleted) {
        return (
            <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2 group`}>
                <div className="max-w-[85%] md:max-w-[75%] flex items-center gap-1.5 px-3.5 md:px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200/60">
                    <Trash2 size={13} className="text-slate-400 shrink-0" />
                    <span className="text-[13px] text-slate-400 italic font-medium">This message was deleted</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2 group`}>
            <div
                className={`relative max-w-[85%] md:max-w-[75%] px-3.5 md:px-4 py-2.5 rounded-2xl shadow-sm transition-shadow
  ${isSent
                        ? 'bg-yellow-400 text-black rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                    }`}
            >
                {/* Message text */}
                <p className={`text-[13.5px] leading-relaxed font-medium whitespace-pre-wrap break-words ${isSent ? 'text-white/95' : 'text-slate-800'}`}>
                    {msg.text}
                </p>

                {/* Meta row — time + seen + countdown */}
                <div className={`flex items-center gap-2 mt-1.5 flex-wrap ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] font-medium ${isSent ? 'text-black' : 'text-slate-400'}`}>
                        {formatTime(msg.createdAt)}
                    </span>

                    {/* Seen badge — only on sent messages */}
                    {isSent && msg.seen && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 font-semibold">
                            <CheckCheck size={12} strokeWidth={2.5} />
                            Seen
                        </span>
                    )}

                    {/* Countdown timer — shown when message is seen and has an expiry */}
                    {msg.seen && msg.expiresAt && (
                        <CountdownBadge expiresAt={msg.expiresAt} />
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Conversation List Item
   ───────────────────────────────────────────── */

const ConversationItem = ({ convo, isActive, onClick }) => {
    const color = pickColor(convo._id || convo.id);

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 border-b border-slate-100
                ${isActive
                    ? 'bg-blue-50/80 border-l-[3px] border-l-blue-600'
                    : 'hover:bg-slate-50/80 border-l-[3px] border-l-transparent'
                }`}
        >
            {/* Avatar */}
            <div className={`relative shrink-0 h-11 w-11 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                {convo.avatar
                    ? <img src={convo.avatar} alt={convo.name} className="h-full w-full rounded-full object-cover" />
                    : getInitials(convo.name)
                }
                {convo.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[13.5px] font-bold text-slate-800 truncate">Technical Team</h4>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 whitespace-nowrap">
                        {formatTime(convo.lastMessageAt)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-[12px] text-slate-500 truncate font-medium">
                        {convo.lastMessage || 'No messages yet'}
                    </p>
                    {(convo.unseenCount > 0) && (
                        <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                            {convo.unseenCount > 99 ? '99+' : convo.unseenCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

/* ─────────────────────────────────────────────
   Empty States
   ───────────────────────────────────────────── */

const EmptyConversations = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <MessageCircle size={28} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700">No Conversations</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-[220px]">Your messages will show up here once a conversation starts.</p>
    </div>
);

const EmptyThread = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-400 rounded-3xl blur-2xl opacity-20" />
            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl">
                <MessageCircle size={36} strokeWidth={1.8} />
            </div>
        </div>
        <h3 className="text-xl font-bold text-slate-700 tracking-tight">Select a Conversation</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-[260px] leading-relaxed">
            Choose a conversation from the sidebar to start messaging.
        </p>
    </div>
);

/* ─────────────────────────────────────────────
   Disclaimer Notice with Language Toggle
   ───────────────────────────────────────────── */

const DisclaimerNotice = () => {
    const [lang, setLang] = useState('en');

    const content = {
        en: {
            title: 'Official Notice',
            badge: 'IMPORTANT',
            label: 'Disclaimer:',
            body: 'All chats on this platform are monitored by the admin/owner, Mr. Gopal Sir, and this chat feature has been created only to help you with your problems and queries. Please use it strictly for study-related or important purposes. Feel free to reach out whenever you need help, but avoid using it for entertainment or unnecessary conversations.',
            sign: '— Thank you, Technical Team, Defacto Institute',
            toggle: 'हिंदी',
        },
        hi: {
            title: 'आधिकारिक सूचना',
            badge: 'ज़रूरी',
            label: 'सूचना:',
            body: 'इस प्लेटफॉर्म पर सभी चैट एडमिन/मालिक, श्री गोपाल सर द्वारा देखी जाती हैं। यह चैट सुविधा सिर्फ आपकी पढ़ाई या किसी समस्या में मदद के लिए बनाई गई है। कृपया इसे केवल ज़रूरी कामों के लिए उपयोग करें। जब भी मदद चाहिए, बेझिझक पूछें — लेकिन मनोरंजन या फालतू बातचीत के लिए इसका इस्तेमाल न करें।',
            sign: '— धन्यवाद, तकनीकी टीम, डिफैक्टो इंस्टीट्यूट',
            toggle: 'English',
        }
    };

    const c = content[lang];

    return (
        <div className="bg-amber-50 m-3 border border-amber-300 rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-amber-100 px-3 py-2 flex items-center justify-between border-b border-amber-300">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📢</span>
                    <h2 className="text-sm md:text-base font-bold text-amber-900">{c.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-amber-300 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                        {c.badge}
                    </span>
                    <button
                        onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                        className="text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded-full font-semibold hover:bg-amber-900 transition-colors"
                    >
                        {c.toggle}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                <p className="text-xs md:text-sm text-amber-900 leading-relaxed font-medium">
                    <span className="font-bold">{c.label}</span> {c.body}
                </p>
                <p className="text-[11px] text-amber-700 mt-3 font-semibold text-right">{c.sign}</p>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   MAIN — ChatTab Component
   ═══════════════════════════════════════════════ */

const ChatTab = ({ currentUserId, currentUserRole = 'student' }) => {
    const navigate = useNavigate();
    /* ── State ── */
    const [conversations, setConversations] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true); // mobile toggle

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const convosFetchedOnce = useRef(false); // tracks if first load is done
    const msgsFetchedOnce = useRef(false);   // tracks if first load is done for messages

    /* ── Derived ── */
    const activeConvo = useMemo(
        () => conversations.find(c => (c._id || c.id) === activeConvoId),
        [conversations, activeConvoId]
    );

    const filteredConvos = useMemo(
        () => conversations.filter(c =>
            c.name?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [conversations, searchQuery]
    );

    /* ── Fetch Conversations ── */
    const fetchConversations = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoadingConvos(true);
            const data = await getConversations(currentUserId);
            setConversations(data.conversations || data || []);
            convosFetchedOnce.current = true;
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        } finally {
            if (!silent) setLoadingConvos(false);
        }
    }, [currentUserId]);

    useEffect(() => { fetchConversations(); }, [fetchConversations]);

    /* ── Fetch Messages for Active Convo ── */
    const fetchMessages = useCallback(async (convoId, silent = false) => {
        if (!convoId) return;
        try {
            if (!silent) setLoadingMsgs(true);
            const data = await getMessages(currentUserId, convoId);
            setMessages(data.messages || data || []);
            // Mark messages as seen when opening
            markSeen(convoId).catch(() => { });
            msgsFetchedOnce.current = true;
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            if (!silent) setLoadingMsgs(false);
        }
    }, [currentUserId]);

    useEffect(() => { msgsFetchedOnce.current = false; fetchMessages(activeConvoId); }, [activeConvoId, fetchMessages]);

    /* ── Auto-scroll ── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ── Poll for new messages (every 8s) — silent, no spinner ── */
    useEffect(() => {
        if (!activeConvoId) return;
        const id = setInterval(() => fetchMessages(activeConvoId, true), 8000);
        return () => clearInterval(id);
    }, [activeConvoId, fetchMessages]);

    /* ── Poll conversations (every 15s) — silent, no skeleton ── */
    useEffect(() => {
        const id = setInterval(() => fetchConversations(true), 15000);
        return () => clearInterval(id);
    }, [fetchConversations]);

    /* ── Send Message ── */
    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || !activeConvoId || sending) return;

        // Optimistic update
        const optimistic = {
            _id: `temp-${Date.now()}`,
            text,
            senderId: currentUserId,
            createdAt: new Date().toISOString(),
            seen: false,
            deleted: false,
        };
        setMessages(prev => [...prev, optimistic]);
        setInputText('');

        try {
            setSending(true);
            const data = await sendMessage(activeConvoId, text);
            // Replace optimistic with actual
            setMessages(prev =>
                prev.map(m => m._id === optimistic._id ? (data.message || data) : m)
            );
            // Refresh sidebar
            fetchConversations();
        } catch (err) {
            console.error('Send failed:', err);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m._id !== optimistic._id));
            setInputText(text); // Restore typed text
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selectConvo = (id) => {
        setActiveConvoId(id);
        setShowSidebar(false); // on mobile, switch to thread
    };

    /* ═══════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════ */
    return (
        <div className="flex h-full md:h-[calc(100vh-90px)] rounded-none md:rounded-2xl border-0 md:border border-slate-200/60 bg-white overflow-hidden md:shadow-[0_4px_24px_rgba(0,0,0,0.04)]">

            {/* ═══════ LEFT — Conversation List ═══════ */}
            <aside
                className={`
                    flex flex-col border-r border-slate-200/60 bg-slate-50/50
                    transition-all duration-300
                    ${showSidebar ? 'w-full md:w-[340px]' : 'hidden md:flex md:w-[340px]'}
                    shrink-0
                `}
            >
                {/* Search Header */}
                <div className="shrink-0 p-4 border-b border-slate-200/60 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                        {/* Back button — mobile only */}
                        <button
                            onClick={() => navigate('/student/dashboard?tab=home')}
                            className="md:hidden h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                            aria-label="Back to dashboard"
                        >
                            <ArrowLeft size={18} strokeWidth={2.5} />
                        </button>
                        <div className="relative group hidden md:block">
                            <div className="absolute inset-0 bg-blue-400 rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                                <MessageCircle size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                        <h2 className="text-[15px] font-extrabold text-slate-800 tracking-tight">Messages</h2>
                        {conversations.length > 0 && (
                            <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
                                {conversations.length}
                            </span>
                        )}
                    </div>

                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search conversations…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                </div>

                {/* Disclaimer Notice */}
                <DisclaimerNotice />

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {loadingConvos ? (
                        <div className="space-y-1 p-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                                    <div className="h-11 w-11 rounded-full bg-slate-200 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-28 bg-slate-200 rounded-full" />
                                        <div className="h-2.5 w-40 bg-slate-100 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredConvos.length === 0 ? (
                        <EmptyConversations />
                    ) : (
                        filteredConvos.map(convo => (
                            <ConversationItem
                                key={convo._id || convo.id}
                                convo={convo}
                                isActive={(convo._id || convo.id) === activeConvoId}
                                onClick={() => selectConvo(convo._id || convo.id)}
                            />
                        ))
                    )}
                </div>
            </aside>

            {/* ═══════ RIGHT — Message Thread ═══════ */}
            <main
                className={`
                    flex-1 flex flex-col bg-slate-50/30 min-w-0
                    ${!showSidebar ? 'flex' : 'hidden md:flex'}
                `}
            >
                {!activeConvo ? (
                    <EmptyThread />
                ) : (
                    <>
                        {/* Thread Header */}
                        <header className="shrink-0 flex items-center gap-3 px-4 md:px-5 py-3.5 border-b border-slate-200/60 bg-white">
                            {/* Back button (mobile only) */}
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                                aria-label="Back to conversations"
                            >
                                <ArrowLeft size={20} strokeWidth={2.5} />
                            </button>

                            {/* Active user avatar */}
                            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${pickColor(activeConvo._id || activeConvo.id)} flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0`}>
                                {activeConvo.avatar
                                    ? <img src={activeConvo.avatar} alt={activeConvo.name} className="h-full w-full rounded-full object-cover" />
                                    : getInitials(activeConvo.name)
                                }
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="text-[14px] font-bold text-slate-800 truncate">Technical Team</h3>
                                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                    {activeConvo.online ? (
                                        <>
                                            <Circle size={7} fill="#22c55e" className="text-emerald-500" />
                                            Online
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={11} className="text-slate-400" />
                                            {currentUserRole === 'student' ? 'Technical Team' : 'Student'}
                                        </>
                                    )}

                                    {/* Verified Blue Tick SVG */}
                                    {currentUserRole === 'student' && (
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-3.5 h-3.5 ml-1"
                                            fill="none"
                                        >
                                            <circle cx="12" cy="12" r="10" fill="#3b82f6" />
                                            <path
                                                d="M8 12.5l2.5 2.5L16 10"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </p>
                            </div>
                        </header>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2 bg-gradient-to-b from-white to-yellow-50">

                            {loadingMsgs ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="flex flex-col items-center gap-3">

                                        {/* Loader */}
                                        <div className="w-9 h-9 border-[3px] border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />

                                        <span className="text-xs text-yellow-700 font-medium tracking-wide">
                                            Loading messages...
                                        </span>
                                    </div>
                                </div>

                            ) : messages.length === 0 ? (

                                <div className="flex flex-col items-center justify-center h-full text-center">

                                    {/* Empty Icon */}
                                    <div className="h-16 w-16 rounded-2xl bg-yellow-100 flex items-center justify-center mb-3 shadow-sm">
                                        <Send size={24} className="text-yellow-500 -rotate-45" />
                                    </div>

                                    <p className="text-sm text-gray-700 font-semibold">
                                        No messages yet
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                                        Start the conversation by sending your first message.
                                    </p>
                                </div>

                            ) : (
                                <>
                                    {messages.map((msg) => (
                                        <MessageBubble
                                            key={msg._id || msg.id}
                                            msg={msg}
                                            isSent={(msg.senderId || msg.sender) === currentUserId}
                                        />
                                    ))}

                                    {/* Auto scroll reference */}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>
                        {/* Input Bar */}
                        <div className="shrink-0 border-t border-slate-200/60 bg-white px-4 md:px-5 py-3">
                            <div className="flex items-end gap-2.5">
                                <textarea
                                    ref={inputRef}
                                    rows={1}
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message…"
                                    className="flex-1 resize-none px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[13.5px] text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all max-h-32"
                                    style={{ minHeight: '44px' }}
                                    onInput={(e) => {
                                        e.target.style.height = '44px';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim() || sending}
                                    className={`shrink-0 h-[44px] w-[44px] rounded-xl flex items-center justify-center transition-all duration-200 
                                        ${inputText.trim()
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_-4px_rgba(37,99,235,0.5)] active:scale-95'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                    aria-label="Send message"
                                >
                                    {sending ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send size={18} strokeWidth={2.5} className="-rotate-45 -translate-x-[1px] translate-y-[1px]" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ChatTab;
