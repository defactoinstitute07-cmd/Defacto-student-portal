import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, User, Trophy, BookOpen,
    Wallet, Award, LogOut, Menu, X, ShieldAlert,
    Settings, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggleButton from './LanguageToggleButton';

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
            { to: '/student/support', match: '/student/support', icon: ShieldAlert, label: 'Contact & Support' },
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

const StudentLayout = ({ children, title, backUrl, useHistoryBack = false, hideMobileNav = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [mini, setMini] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const studentInfoRaw = localStorage.getItem('studentInfo');
    const student = studentInfoRaw ? JSON.parse(studentInfoRaw) : {};

    const logout = () => {
        try {
            sessionStorage.setItem('auth_redirecting', '1');
        } catch {
            // no-op
        }
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentInfo');
        window.location.replace('/student/login');
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            <nav className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0b0f15] transition-all duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} 
                md:relative md:translate-x-0 
                ${mini ? 'w-20' : 'w-64'}`}
            >
                {/* Brand Header */}
                <div className={`flex items-center gap-2.5 p-3 md:gap-3 md:px-4 md:py-4 shrink-0 
                    ${mini && !mobileOpen ? 'justify-center' : 'w-full'}`}>

                    <div className="flex items-center justify-center shrink-0" aria-hidden="true">
                        <img
                            src="https://res.cloudinary.com/dsks5swu1/image/upload/v1775565407/erp_uploads/xcoemwx25dr8gcjkm4ha.png"
                            alt="Defacto Logo"
                            className="object-contain w-10 h-10 rounded-lg md:w-11 md:h-11"
                        />
                    </div>

                    {(!mini || mobileOpen) && (
                        <div className="flex flex-col justify-center whitespace-nowrap overflow-hidden">
                            <div className="text-[#FFD700] text-[20px] font-bold font-sans leading-tight tracking-[0.5px]">
                                Defacto
                            </div>
                            <div className="text-white text-[11px] font-medium mt-0.5 tracking-[0.5px]">
                                Institute <span className="text-[#888888] mx-[2px]">|</span> BHANIYAWALA
                            </div>
                        </div>
                    )}
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
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200
                                                ${mini && !mobileOpen ? 'justify-center' : ''}
                                                ${active
                                                    ? 'bg-blue-600/15 text-blue-400 font-medium'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            onClick={() => setMobileOpen(false)}
                                            title={mini && !mobileOpen ? t(item.label) : ''}
                                        >
                                            <span className="shrink-0"><item.icon size={18} strokeWidth={active ? 2.5 : 2} /></span>
                                            {(!mini || mobileOpen) && (
                                                <span className="truncate">{t(item.label)}</span>
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

                {/* Topbar */}
                <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
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
                <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 pb-24 md:pb-6 relative scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation (Fixed Z-index & Auto Hide) */}
            {!hideMobileNav && (
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