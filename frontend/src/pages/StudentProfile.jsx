import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import Skeleton from '../components/Skeleton';
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    Moon,
    Shield,
    LogOut,
    ChevronRight,
    RefreshCcw,
    AlertTriangle,
    User,
    MapPin,
    Briefcase,
    FileText,
    Hash,
    BookOpen,
    Clock,
    UserCheck,
    Heart
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const EMPTY_VALUE = '-';
const DEFAULT_PROFILE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="#eef2ff"/><circle cx="120" cy="90" r="42" fill="#c7d2fe"/><path d="M40 214c10-39 42-64 80-64s70 25 80 64" fill="#c7d2fe"/></svg>'
)}`;

const formatValue = (value) => {
    if (value === null || value === undefined) return EMPTY_VALUE;
    if (typeof value === 'string' && value.trim() === '') return EMPTY_VALUE;
    return value;
};

const formatDateValue = (value, locale) => {
    if (!value) return EMPTY_VALUE;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
    return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatCurrency = (value) => `\u20b9${Number(value || 0).toLocaleString('en-IN')}`;

const DetailRow = ({ icon: Icon, label, value, colorClass = "text-slate-400" }) => (
    <div className="flex items-center gap-4 rounded-[15px] bg-slate-50 p-3.5 transition-all hover:bg-slate-100/80">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${colorClass}`}>
            <Icon size={18} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
            <span className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value || EMPTY_VALUE}</span>
        </div>
    </div>
);

const SettingRow = ({ icon: Icon, label, type, active, onClick }) => (
    <div className="flex cursor-pointer items-center justify-between border-b border-slate-100 py-3.5 last:border-0" onClick={onClick}>
        <div className="flex items-center gap-3.5">
            <div className="text-slate-400">
                <Icon size={18} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        {type === 'toggle' ? (
            <div className={`flex h-6 w-11 items-center rounded-[15px] px-1 transition-colors ${active ? 'bg-[#191838]' : 'bg-slate-200'}`}>
                <div className={`h-4 w-4 rounded-[15px] bg-white shadow-sm transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        ) : (
            <ChevronRight size={18} className="text-slate-300" />
        )}
    </div>
);

const SectionHeader = ({ title }) => (
    <h3 className="mb-4 mt-8 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#191838]">
        {title}
    </h3>
);

const StudentProfile = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const apiBaseUrl = api.defaults.baseURL || '/api';
    const locale = language === 'hi' ? 'hi-IN' : 'en-GB';
    const [error, setError] = useState('');
    const token = localStorage.getItem('studentToken');

    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    useEffect(() => {
        if (!token) navigate('/student/login');
    }, [navigate, token]);

    const { data: student, isLoading } = useQuery({
        queryKey: ['student', 'me'],
        enabled: !!token,
        queryFn: async () => {
            try {
                const res = await api.get('/student/me');
                if (res.data.success) {
                    await setCached('student.me', res.data.student);
                    return res.data.student;
                }
                throw new Error('Failed to load');
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('studentToken');
                    navigate('/student/login');
                    throw err;
                }
                const cached = await getCached('student.me');
                if (cached) return cached;
                throw err;
            }
        },
        onError: () => setError(t('Failed to load profile data.'))
    });

    // If there's an error and no student data, display an error message or redirect
    if (!isLoading && !student && error) {
        return (
            <div className="px-4 py-10">
                <div className="space-y-3 rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-rose-700">
                        <AlertTriangle size={18} />
                        <p className="text-sm font-bold">{t('Profile data could not be loaded.')}</p>
                    </div>
                    <p className="text-xs text-rose-600/80">
                        {error || t('This build is trying to reach {{url}}.', { url: apiBaseUrl })}
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="h-11 w-full rounded-[15px] bg-[#191838] text-xs font-black uppercase tracking-[0.24em] text-white"
                    >
                        {t('Retry')}
                    </button>
                </div>
            </div>
        );
    }

    const attendancePercent = student?.attendanceSummary?.percentage || 0;
    const academicStatus = student?.status === 'batch_pending' ? t('Pending Batch') : (student?.status || t('Active'));
    const primaryColor = "#191838";
    const getAttendanceColor = (percent) => {
        if (percent < 50) return 'bg-red-500';
        if (percent < 75) return 'bg-orange-500';
        return 'bg-green-500';
    };

    const getAttendanceTextColor = (percent) => {
        if (percent < 50) return 'text-red-500';
        if (percent < 75) return 'text-orange-500';
        return 'text-green-500';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans selection:bg-indigo-100 flex flex-col no-scrollbar scroll-smooth">
                {/* Skeleton Header */}
                <div className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm border-b border-slate-100 mb-8">
                    <div className="flex flex-col items-center text-center max-w-lg mx-auto">
                        <Skeleton className="w-24 h-24 rounded-[32px] mb-5" />
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>

                <div className="px-6 space-y-8">
                    {/* Skeleton Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-32 w-full rounded-[15px]" />
                        <Skeleton className="h-32 w-full rounded-[15px]" />
                    </div>

                    {/* Skeleton Detail Rows */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32 mb-4" />
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-16 w-full rounded-[15px]" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p0">
            
            {/* 1. Header Card - Avatar & Primary Info */}
            <div className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
                {/* Decorative Background Pattern */}
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-[15px] bg-indigo-50/50" />
                
                <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:text-left">
                    <div className="relative h-24 w-24 shrink-0">
                        <div className="h-full w-full overflow-hidden rounded-[32px] border-4 border-white bg-slate-50 shadow-md">
                            <img
                                src={student.profileImage || DEFAULT_PROFILE_IMAGE}
                                alt={student.name || 'Student profile'}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                    event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                                }}
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-[15px] border-2 border-white bg-[#191838] text-white shadow-sm">
                            <UserCheck size={14} />
                        </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-2xl font-black text-gray-900">{student.name}</h2>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <span className="inline-flex items-center gap-1.5 rounded-[15px] bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                                <Hash size={12} /> {student.rollNo || EMPTY_VALUE}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-[15px] bg-indigo-50 px-3 py-1 text-[11px] font-bold text-[#191838]">
                                <Clock size={12} /> {student.session || '2026-2027'}
                            </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-500">
                            {student.className || student.batchName || t('Batch Pending')}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Grid for Sections */}
            <div className="mt-6 grid grid-cols-1 gap-6">
                
                {/* Academic Summary */}
                <section>
                    <SectionHeader title={t('Academic Summary')} />
                                        <div className="rounded-[15px] border border-gray-100 bg-white p-5 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                                {t('Attendance')}
                                                        </span>
                                                        <span className={`text-lg font-black ${getAttendanceTextColor(attendancePercent)}`}>
                                                                {attendancePercent}%
                                                        </span>
                                                </div>

                                                <div className="mt-3 h-2 w-full overflow-hidden rounded-[15px] bg-slate-100">
                                                        <div
                                                                className={`h-full transition-all ${getAttendanceColor(attendancePercent)}`}
                                                                style={{ width: `${attendancePercent}%` }}
                                                        />
                                                </div>

                                                <div className="mt-5 space-y-3">
                                                        <DetailRow icon={BookOpen} label={t('Current Session')} value={student.session} colorClass="text-indigo-600" />
                                                        <DetailRow icon={Calendar} label={t('Admission Date')} value={formatDateValue(student.admissionDate, locale)} colorClass="text-indigo-600" />
                                                        <DetailRow icon={UserCheck} label={t('Account Status')} value={academicStatus} colorClass="text-indigo-600" />
                                                </div>
                                        </div>
                </section>

                {/* Guardian Info */}
                <section>
                    <SectionHeader title={t('Guardian Info')} />
                    <div className="space-y-3">
                        <DetailRow icon={User} label={t("Father's Name")} value={formatValue(student.fatherName)} colorClass="text-indigo-500" />
                        <DetailRow icon={Heart} label={t("Mother's Name")} value={formatValue(student.motherName)} colorClass="text-rose-500" />
                    </div>
                </section>

                {/* Personal Contact */}
                <section>
                    <SectionHeader title={t('Personal Contact')} />
                    <div className="space-y-3">
                        <DetailRow icon={Mail} label={t('Email Address')} value={formatValue(student.email)} colorClass="text-blue-500" />
                        <DetailRow icon={Phone} label={t('Phone Number')} value={formatValue(student.contact)} colorClass="text-amber-500" />
                        <DetailRow icon={MapPin} label={t('Address')} value={formatValue(student.address)} colorClass="text-rose-500" />
                        <DetailRow icon={User} label={t('Gender')} value={formatValue(student.gender)} colorClass="text-indigo-500" />
                        <DetailRow icon={Calendar} label={t('DOB')} value={formatDateValue(student.dob, locale)} colorClass="text-blue-500" />
                    </div>
                </section>

            </div>

            {/* 3. Bio / Notes */}
            {(student.notes || student.bio) && (
                <section className="mt-8">
                    <SectionHeader title={t('Notes & Bio')} />
                    <div className="rounded-[15px] border border-gray-100 bg-indigo-50/30 p-5">
                        <div className="flex gap-3">
                            <FileText className="shrink-0 text-[#191838]" size={18} />
                            <p className="text-sm italic leading-relaxed text-slate-600">
                                {student.notes || student.bio}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* Settings & Support */}
            <section>
                <SectionHeader title={t('Settings & Support')} />
                <div className="rounded-[15px] bg-white p-5 border border-slate-100 shadow-sm divide-y divide-slate-50">
                    <SettingRow 
                        icon={Briefcase} 
                        label={t('Contact Support')} 
                        type="link" 
                        onClick={() => navigate('/student/support')}
                    />
                </div>
                
                <button 
                    onClick={() => {
                        localStorage.removeItem('studentToken');
                        navigate('/student/login');
                    }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-[15px] bg-white px-4 py-4 text-sm font-extrabold text-rose-500 border border-rose-100 shadow-sm transition active:scale-95"
                >
                    <LogOut size={18} />
                    {t('Sign Out')}
                </button>
            </section>

            
        </div>
    );
};

export default StudentProfile;