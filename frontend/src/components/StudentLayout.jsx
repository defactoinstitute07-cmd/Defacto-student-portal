import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, User, Trophy, BookOpen,
    Wallet, Award, LogOut, Menu, X, ShieldAlert,
    Settings, ArrowLeft, RefreshCw, MessageCircle, UserCog
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggleButton from './LanguageToggleButton';
import { clearAuthSession } from '../services/api';
import { getConversations } from '../services/chatService';

const NAV_ITEMS = [
    {
        section: 'MAIN',
        items: [
            { to: '/student/dashboard?tab=home', match: 'home', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/student/profile', match: 'profile', icon: User, label: 'My Profile' },
        ]
    },
    {
        section: 'ACADEMICS',
        items: [
            { to: '/student/dashboard?tab=subjects', match: 'subjects', icon: BookOpen, label: 'Subjects' },
            { to: '/student/dashboard?tab=results', match: 'results', icon: Award, label: 'Results' },
            { to: '/student/leaderboard', match: '/student/leaderboard', icon: Trophy, label: 'Leaderboard' },
        ]
    },
    {
        section: 'INFO',
        items: [
            { to: '/student/dashboard?tab=fees', match: 'fees', icon: Wallet, label: 'Fees' },
            { to: '/student/dashboard?tab=chat', match: 'chat', icon: MessageCircle, label: 'Support & Chat', newUntil: '2026-05-28' },
            { to: '/student/support', match: '/student/support', icon: UserCog, label: 'Creators' },
            { to: '/student/settings', match: '/student/settings', icon: Settings, label: 'Settings' },
        ]
    }
];

const MOBILE_NAV_ITEMS = [
    { to: '/student/dashboard?tab=home', match: 'home', icon: LayoutDashboard, label: 'Home' },
    { to: '/student/dashboard?tab=subjects', match: 'subjects', icon: BookOpen, label: 'Subjects' },
    { to: '/student/dashboard?tab=results', match: 'results', icon: Award, label: 'Results' },
    { to: '/student/dashboard?tab=fees', match: 'fees', icon: Wallet, label: 'Fees' },
    { to: '/student/profile', match: 'profile', icon: User, label: 'My Profile' }
];

const StudentLayout = ({ children, title, backUrl, useHistoryBack = false, hideMobileNav = false, hideChrome = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [mini, setMini] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [chatUnseenCount, setChatUnseenCount] = useState(0);

    const studentInfoRaw = localStorage.getItem('studentInfo');
    const student = studentInfoRaw ? JSON.parse(studentInfoRaw) : {};

    const logout = () => {
        try {
            sessionStorage.setItem('auth_redirecting', '1');
        } catch {
            // no-op
        }
        clearAuthSession();
        window.location.replace('/student/login');
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /* ── Chat unseen badge polling ── */
    const fetchUnseenCount = useCallback(async () => {
        try {
            const userId = student?._id || student?.id;
            if (!userId) return;
            const data = await getConversations(userId);
            const convos = data.conversations || data || [];
            const total = convos.reduce((sum, c) => sum + (c.unseenCount || 0), 0);
            setChatUnseenCount(total);
        } catch {
            // silent — badge is non-critical
        }
    }, [student?._id, student?.id]);

    useEffect(() => {
        fetchUnseenCount();
        const id = setInterval(fetchUnseenCount, 30000);
        return () => clearInterval(id);
    }, [fetchUnseenCount]);

    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'home';

    const isActiveRoute = (match) => {
        if (!match) return false;
        if (match.startsWith('/')) {
            return location.pathname === match || location.pathname.startsWith(`${match}/`);
        }
        return location.pathname === '/student/dashboard' && currentTab === match;
    };

    const handleBack = () => {
        if (useHistoryBack && window.history.length > 1) {
            navigate(-1);
            return;
        }
        if (backUrl) {
            navigate(backUrl);
            return;
        }
        navigate('/student/dashboard?tab=home');
    };

    const handleRefresh = () => {
        setRefreshing(true);
        window.location.reload();
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-sm">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <nav className={`fixed inset-y-0 left-0 z-50 flex flex-col 
    bg-white !bg-white opacity-100
    transition-all duration-300 ease-in-out
    ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} 
    md:relative md:translate-x-0 
    ${mini ? 'w-20' : 'w-64'}`}
            >
                {/* Brand Header */}
                <div
                    className={`flex items-center gap-2.5 p-3 md:gap-3 md:px-4 md:py-4 shrink-0 
  relative
  ${mini && !mobileOpen ? 'justify-center' : 'w-full'}`}
                >

                    {/* Logo */}
                    <div className="flex items-center justify-center shrink-0" aria-hidden="true">
                        <img
                            src="https://res.cloudinary.com/dsks5swu1/image/upload/v1775565407/erp_uploads/xcoemwx25dr8gcjkm4ha.png"
                            alt="Defacto Logo"
                            className="object-contain w-10 h-10 rounded-lg md:w-11 md:h-11"
                        />
                    </div>

                    {/* Text */}
                    {(!mini || mobileOpen) && (
                        <div className="flex flex-col justify-center whitespace-nowrap overflow-hidden">

                            {/* Gradient Title */}
                            <div
                                className="text-[27px] font-bold font-sans leading-tight tracking-[0.5px] 
        bg-gradient-to-br from-[#FFD700] via-[#FFC300] to-[#FF8C00] 
        bg-clip-text text-transparent"
                            >
                                Defacto
                            </div>

                            {/* Subtitle */}
                            <div className="text-black text-[13px] font-medium mt-0.5 tracking-[0.5px]">
                                Institute <span className="text-[#888888] mx-[2px]">|</span> BHANIYAWALA
                            </div>
                        </div>
                    )}

                    {/* 🔥 Premium Bottom Gradient Line */}
                    <div className="absolute bottom-0 left-4 right-4 h-[2px] 
    bg-gradient-to-r from-[#FFD700] via-[#FFC300] to-[#FF8C00] 
    rounded-full opacity-80">
                    </div>

                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    {NAV_ITEMS.map(group => (
                        <div key={group.section} className="mb-6 px-3">
                            {(!mini || mobileOpen) && (
                                <div className="flex items-center px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2 shrink-0" />
                                    {t(group.section)}
                                </div>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const active = isActiveRoute(item.match);
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            className={`flex items-center gap-3 px-4 py-4 rounded-lg transition-colors duration-200
                                                ${mini && !mobileOpen ? 'justify-center' : ''}
                                                ${active
                                                    ? 'bg-gradient-to-br from-[#FFD700] via-[#FFC300] to-[#FF8C00] text-gray-700 font-bold'
                                                    : 'text-gray-700 hover:text-black hover:bg-white/5'
                                                }`}
                                            onClick={() => setMobileOpen(false)}
                                            title={mini && !mobileOpen ? t(item.label) : ''}
                                        >
                                            <span className="relative shrink-0">
                                                <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                                                {item.match === 'chat' && chatUnseenCount > 0 && (
                                                    <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                                        {chatUnseenCount > 99 ? '99+' : chatUnseenCount}
                                                    </span>
                                                )}
                                            </span>
                                            {(!mini || mobileOpen) && (
                                                <span className="truncate flex items-center gap-2">
                                                    {t(item.label)}
                                                    {item.newUntil && new Date() < new Date(item.newUntil) && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wider ring-1 ring-emerald-200 animate-pulse">
                                                            NEW
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-800/50 shrink-0">
                    <button
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-rose-500 hover:text-rose-400 hover:bg-rose-500/10
                            ${mini && !mobileOpen ? 'justify-center' : ''}`}
                        onClick={logout}
                        title={mini && !mobileOpen ? t('Logout') : ''}
                    >
                        <span className="shrink-0"><LogOut size={18} /></span>
                        {(!mini || mobileOpen) && (
                            <span className="font-semibold">{t('Logout')}</span>
                        )}
                    </button>
                </div>
            </nav>

            {/* Main Body */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Topbar — hidden on mobile when chat is fullscreen */}
                <header className={`h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 ${hideChrome ? 'hidden md:flex' : ''}`}>
                    <div className="flex items-center gap-3">
                        {backUrl || useHistoryBack ? (
                            <button
                                className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                                onClick={handleBack}
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <button
                                className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                    if (window.innerWidth <= 768) setMobileOpen(!mobileOpen);
                                    else setMini(!mini);
                                }}
                            >
                                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        )}
                        <div className="font-semibold text-lg text-gray-800 truncate max-w-[150px] md:max-w-md">{t(title)}</div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title={t('Refresh')}
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin text-blue-600' : ''} />
                        </button>
                        <LanguageToggleButton variant="topbar" />

                        <span className="hidden md:block text-sm text-gray-600">
                            {t('Hi')}, <strong className="text-gray-900">{student.name?.split(' ')[0] || 'Student'}</strong>
                        </span>

                        <div
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm cursor-pointer border border-blue-200 overflow-hidden shrink-0"
                            onClick={() => navigate('/student/profile')}
                        >
                            {student.profileImage ? (
                                <img src={student.profileImage} alt={student.name || 'Student'} className="w-full h-full object-cover" />
                            ) : (
                                (student.name?.[0] || 'S').toUpperCase()
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className={`flex-1 overflow-y-auto bg-slate-50 relative scroll-smooth ${hideChrome ? 'p-0 pb-0' : 'p-4 md:p-6 pb-24 md:pb-6'}`}>
                    <div className={hideChrome ? 'h-full' : 'max-w-7xl mx-auto'}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation (Fixed Z-index & Auto Hide) */}
            {!hideMobileNav && !hideChrome && (
                <nav
                    className={`fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-30 md:hidden transition-all duration-300 ${mobileOpen ? 'opacity-0 pointer-events-none translate-y-5' : 'opacity-100 translate-y-0'
                        }`}
                    aria-label="Primary"
                >
                    <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md shadow-lg shadow-gray-200/50 px-2 py-1.5">
                        <div
                            className="grid items-center"
                            style={{ gridTemplateColumns: `repeat(${MOBILE_NAV_ITEMS.length}, minmax(0, 1fr))` }}
                        >
                            {MOBILE_NAV_ITEMS.map(({ to, match, icon: Icon, label }) => {
                                const active = isActiveRoute(match);

                                return (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={`flex flex-col items-center justify-center py-1 text-[11px] transition-colors duration-200 
                                        ${active ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-500 font-medium'}`}
                                    >
                                        <div className={`mb-1 transition-transform duration-200 ${active ? '-translate-y-0.5' : ''}`}>
                                            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                                        </div>
                                        <span>{t(label)}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>
            )}
        </div>
    );
};

export default StudentLayout;
