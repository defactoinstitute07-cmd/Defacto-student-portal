import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Search, Send, CheckCheck, MessageCircle, ShieldCheck, ArrowLeft } from 'lucide-react';

const AdminChat = ({ currentAdminId }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showChat, setShowChat] = useState(false); // mobile: toggle between sidebar & chat
    const messagesEndRef = useRef(null);

    // Create a dedicated axios instance for admin to bypass student api interceptors
    const getAdminApi = () => {
        const token = localStorage.getItem('adminToken');
        return axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005/api',
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    // Fetch list of students who have messaged the admin
    const fetchConversations = useCallback(async () => {
        try {
            const adminApi = getAdminApi();
            const { data } = await adminApi.get(`/chat/conversations/${currentAdminId}`);
            setConversations(data.conversations || []);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
    }, [currentAdminId]);

    useEffect(() => {
        fetchConversations();
        const id = setInterval(fetchConversations, 10000);
        return () => clearInterval(id);
    }, [fetchConversations]);

    // Fetch messages for a specific student
    const fetchMessages = useCallback(async (studentId) => {
        if (!studentId) return;
        try {
            const adminApi = getAdminApi();
            const { data } = await adminApi.get(`/chat/messages/${studentId}`, { params: { userId: currentAdminId } });
            setMessages(data.messages || []);
            await adminApi.patch(`/chat/seen/${studentId}`);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    }, [currentAdminId]);

    useEffect(() => {
        fetchMessages(activeConvoId);
        const id = setInterval(() => fetchMessages(activeConvoId), 5000);
        return () => clearInterval(id);
    }, [activeConvoId, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectConvo = (id) => {
        setActiveConvoId(id);
        setShowChat(true); // on mobile, switch to chat view
    };

    const handleBack = () => {
        setShowChat(false); // on mobile, go back to sidebar
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || !activeConvoId) return;

        const tempMsg = {
            _id: `temp-${Date.now()}`,
            text,
            senderId: currentAdminId,
            createdAt: new Date().toISOString(),
            seen: false
        };
        setMessages(prev => [...prev, tempMsg]);
        setInputText('');

        try {
            const adminApi = getAdminApi();
            await adminApi.post('/chat/send', { to: activeConvoId, text });
            fetchConversations();
        } catch (err) {
            console.error('Send failed:', err);
        }
    };

    const activeConvo = conversations.find(c => c._id === activeConvoId);
    const filteredConvos = conversations.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full rounded-none md:rounded-2xl border-0 md:border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* ── Sidebar: Student List ── */}
            <aside className={`
                w-full md:w-80 flex flex-col border-r border-slate-200 bg-slate-50
                ${showChat ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <MessageCircle size={20} className="text-blue-600" />
                        Student Inquiries
                    </h2>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredConvos.length === 0 && (
                        <div className="p-6 text-center text-slate-400 text-sm">
                            No conversations yet
                        </div>
                    )}
                    {filteredConvos.map(convo => (
                        <button
                            key={convo._id}
                            onClick={() => handleSelectConvo(convo._id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 text-left transition-colors
                                ${activeConvoId === convo._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}`}
                        >
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0 overflow-hidden">
                                {convo.avatar ? <img src={convo.avatar} alt="avatar" className="h-full w-full object-cover" /> : convo.name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-slate-800 text-sm truncate">{convo.name}</h4>
                                    {convo.unseenCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                                            {convo.unseenCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{convo.lastMessage}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* ── Main Area: Chat Thread ── */}
            <main className={`
                flex-1 flex flex-col bg-white
                ${showChat ? 'flex' : 'hidden md:flex'}
            `}>
                {!activeConvo ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
                        <MessageCircle size={48} className="mb-4 opacity-50" />
                        <p className="text-center">Select a student to view their messages</p>
                    </div>
                ) : (
                    <>
                        <header className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 flex items-center gap-3 bg-white">
                            {/* Back button — visible only on mobile */}
                            <button
                                onClick={handleBack}
                                className="md:hidden h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 shrink-0 overflow-hidden">
                                {activeConvo.avatar ? <img src={activeConvo.avatar} alt="avatar" className="h-full w-full object-cover" /> : activeConvo.name?.[0]}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-800 truncate">
                                    {activeConvo.name}
                                    {activeConvo.rollNo && (
                                        <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                            {activeConvo.rollNo}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <ShieldCheck size={12} /> Registered Student
                                </p>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 bg-slate-50/50">
                            {messages.map(msg => {
                                const isSentByAdmin = msg.senderId === currentAdminId;
                                return (
                                    <div key={msg._id} className={`flex mb-3 ${isSentByAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] px-3.5 md:px-4 py-2.5 rounded-2xl ${isSentByAdmin ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                                            <p className="text-[13px] md:text-[14px] leading-relaxed">{msg.text}</p>
                                            <div className={`text-[10px] mt-1 flex items-center gap-1 ${isSentByAdmin ? 'text-blue-100 justify-end' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isSentByAdmin && msg.seen && <CheckCheck size={12} className="text-emerald-300" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 md:p-4 bg-white border-t border-slate-200">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your reply..."
                                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className="h-11 w-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                                >
                                    <Send size={18} className="-translate-x-0.5 translate-y-0.5 -rotate-45" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminChat;
