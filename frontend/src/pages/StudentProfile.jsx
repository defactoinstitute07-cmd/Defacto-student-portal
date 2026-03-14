import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    User, Mail, Calendar, MapPin,
    RefreshCcw, AlertTriangle,
    Users, Home, GraduationCap,
    Phone, CreditCard, School, ExternalLink,
    ChevronRight, Award, X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

// 1. Mobile-Optimized Info Card
const InfoCard = ({ icon: Icon, label, value, colorClass = "bg-blue-50 text-blue-600" }) => (
    <div className="flex flex-col p-3.5 rounded-md bg-white border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center mb-2 ${colorClass}`}>
            <Icon size={16} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{value || '—'}</p>
        </div>
    </div>
);

// 2. Native Mobile Bottom Sheet for Batch Details
const BatchDetailModal = ({ isOpen, onClose, batch, room }) => {
    const { t } = useLanguage();
    if (!isOpen || !batch) return null;
    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Bottom Sheet */}
            <div
                className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-full duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-14 h-1.5 bg-gray-300 rounded-md"></div>
                </div>

                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                            {t('Assigned Batch')}
                        </span>
                        <h3 className="text-lg font-black text-gray-900 leading-tight">
                            {batch?.name || t('Batch')}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 rounded-md active:scale-90 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scroll Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {t('Classroom')}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {room || "N/A"}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {t('Course Type')}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {batch?.course || t('Academic')}
                            </p>
                        </div>
                    </div>

                    {/* Subjects */}
                    <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                            {t('Batch Subjects')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {batch?.subjects?.length ? (
                                batch.subjects.map((subject) => (
                                    <span
                                        key={subject}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[11px] font-semibold rounded-md border border-blue-100"
                                    >
                                        {subject}
                                    </span>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400">{t('No subjects assigned')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Button */}
                <div className="p-4 border-t border-gray-100 bg-white pb-safe">
                    <button
                        onClick={onClose}
                        className="w-full p-3.5 text-white text-sm font-semibold rounded-xl bg-gradient-to-r from-gray-800 to-black active:scale-95 transition-all"
                    >
                        {t('Close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentProfile = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const apiBaseUrl = api.defaults.baseURL || '/api';
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const token = localStorage.getItem('studentToken');

    useEffect(() => {
        if (!token) {
            navigate('/student/login');
        }
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


    if (isLoading) {
        return (
            <StudentLayout title="Profile">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <RefreshCcw className="animate-spin text-blue-500" size={28} />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t('Loading Profile...')}</p>
                </div>
            </StudentLayout>
        );
    }

    if (!student) {
        return (
            <StudentLayout title="Profile">
                <div className="px-4 py-10">
                    <div className="bg-white rounded-md border border-rose-100 shadow-sm p-5 space-y-3">
                        <div className="flex items-center gap-3 text-rose-600">
                            <AlertTriangle size={18} />
                            <p className="text-sm font-bold">{t('Profile data could not be loaded.')}</p>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {error || t('This build is trying to reach {{url}}. If you are using the local backend, keep it running and connect the phone to the same Wi-Fi.', { url: apiBaseUrl })}
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="w-full h-11 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-md"
                        >
                            {t('Retry')}
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const attendanceSummary = student.attendanceSummary || { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };
    const attendanceRecent = Array.isArray(student.attendanceRecent) ? student.attendanceRecent : [];
    const attendanceTone = attendanceSummary.percentage >= 75 ? 'text-emerald-500' : attendanceSummary.percentage >= 60 ? 'text-amber-500' : 'text-rose-500';

    const getAttendanceBadgeClass = (status) => {
        if (status === 'Present') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (status === 'Late') return 'bg-amber-50 text-amber-600 border-amber-100';
        if (status === 'Absent') return 'bg-rose-50 text-rose-600 border-rose-100';
        return 'bg-gray-50 text-gray-500 border-gray-200';
    };

    const formatAttendanceDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'short' });
    };


    return (
        <StudentLayout title="Profile">
            <div className="w-full max-w-md mx-auto pb-24 sm:pb-12 animate-in fade-in duration-300 bg-gray-50 min-h-screen">
                
<div className="pt-12 pb-6 px-6 mb-6 flex flex-col items-center relative border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
    
    {/* Solid Blue Top Pattern/Header */}
    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-black to-indigo-950"></div>
    
    {/* Optional: Blue background ke upar halka sa dot pattern */}
    <div className="absolute top-0 left-0 w-full h-24 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, #000000 0px)', backgroundSize: '16px 16px' }}></div>

    {/* Main Content (Image ko rounded-full aur border diya hai taaki blue par ubhar kar aaye) */}
    <div className="relative z-10 h-24 w-24 rounded-full flex items-center justify-center bg-white text-blue-800 text-4xl font-black overflow-hidden mb-3 border-4 border-white shadow-md">
        {student.profileImage ? (
            <img src={student.profileImage} alt={student.name} className="h-full w-full object-cover" />
        ) : (
            student.name[0].toUpperCase()
        )}
    </div>
    
    {/* Name aur Blue Tick */}
    <div className="relative z-10 flex items-center gap-1.5 mt-1">
        <h2 className="text-xl font-black text-gray-900 tracking-tight text-center">{student.name}</h2>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    </div>

    {/* Roll No Badge */}
    <div className="relative z-10 flex items-center gap-2 mt-2 px-3 py-1 rounded-full border border-gray-200 bg-gray-50">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{student.rollNo}</p>
    </div>

</div>

                {/* 2. Enrollment Horizontal Scroll */}
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <School size={16} className="text-blue-500" />
                        <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t('Enrollment')}</span>
                    </div>
                    <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 hide-scrollbar snap-x">
                        {/* Class Card */}
                        <div className="min-w-[140px] bg-white p-4 rounded-md border border-gray-100 shadow-sm snap-start shrink-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('Class / Level')}</p>
                            <p className="text-sm font-bold text-gray-800 truncate">{student.className || t('Not Assigned')}</p>
                        </div>
                        {/* Batch Card (Clickable) */}
                        <div 
                            onClick={() => setIsBatchModalOpen(true)}
                            className="min-w-[140px] bg-blue-50/50 p-4 rounded-md border border-blue-100 shadow-sm snap-start shrink-0 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">{t('Active Batch')}</p>
                            <div className="flex items-center gap-1.5 text-blue-600">
                                <p className="text-sm font-bold truncate">{student.batchName}</p>
                                <ExternalLink size={12} className="shrink-0" />
                            </div>
                        </div>
                        {/* Admission Card */}
                        <div className="min-w-[140px] bg-white p-4 rounded-md border border-gray-100 shadow-sm snap-start shrink-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('Admission')}</p>
                            <p className="text-sm font-bold text-gray-800 truncate">
                                {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Identity Grid (2 Column Mobile) */}
                <div className="px-2 mb-6">

    <div className="flex items-center gap-2 mb-3">
        <User size={16} className="text-indigo-500" />
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            {t('Personal Details')}
        </h3>
    </div>

    <div className="overflow-hidden bg-white rounded-md shadow-sm border border-gray-200">
    <table className="w-full text-sm text-left">
        <tbody className="divide-y divide-gray-100">
            
            <tr className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/60 transition-colors">
                <td className="font-semibold text-gray-600 py-3.5 px-5 w-1/3 sm:w-48">{t('Date of Birth')}</td>
                <td className="py-3.5 px-5 text-gray-900 font-medium">
                    {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '—'}
                </td>
            </tr>

            <tr className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/60 transition-colors">
                <td className="font-semibold text-gray-600 py-3.5 px-5">{t('Gender')}</td>
                <td className="py-3.5 px-5 text-gray-900 font-medium">{student.gender || '—'}</td>
            </tr>

            <tr className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/60 transition-colors">
                <td className="font-semibold text-gray-600 py-3.5 px-5">{t('Contact')}</td>
                <td className="py-3.5 px-5 text-gray-900 font-medium">{student.contact || '—'}</td>
            </tr>

            <tr className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/60 transition-colors">
                <td className="font-semibold text-gray-600 py-3.5 px-5">{t('Email')}</td>
                <td className="py-3.5 px-5 text-gray-900 font-medium break-all">{student.email || '—'}</td>
            </tr>

            <tr className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/60 transition-colors">
                <td className="font-semibold text-gray-600 py-3.5 px-5">{t('Address')}</td>
                <td className="py-3.5 px-5 text-gray-900 font-medium">{student.address || '—'}</td>
            </tr>

        </tbody>
    </table>
</div>

</div>
<div className="px-2 mb-6">

    <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-indigo-500" />
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            {t('Parents / Guardians')}
        </h3>
    </div>

   <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
    <table className="w-full text-sm text-left">
        <tbody className="divide-y divide-gray-100">

            <tr className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/60 transition-colors">
                <td className="font-semibold text-gray-600 py-3.5 px-5 w-1/3 sm:w-48">{t('Father Name')}</td>
                <td className="py-3.5 px-5 text-gray-900 font-medium">{student.fatherName || '—'}</td>
            </tr>

            <tr className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/60 transition-colors">
                <td className="font-semibold text-gray-600 py-3.5 px-5">{t('Mother Name')}</td>
                <td className="py-3.5 px-5 text-gray-900 font-medium">{student.motherName || '—'}</td>
            </tr>

            <tr className="odd:bg-white even:bg-slate-50 hover:bg-blue-50/60 transition-colors">
                <td className="font-semibold text-gray-600 py-3.5 px-5">{t('Guardian Contact')}</td>
                <td className="py-3.5 px-5 text-gray-900 font-medium">{student.parentContact || '—'}</td>
            </tr>

        </tbody>
    </table>
</div>

</div>

                {/* 4. Mobile Attendance Overview */}
                <div className="px-4 mb-6 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Award size={16} className="text-emerald-500" />
                        <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t('Attendance Stats')}</h3>
                    </div>
                    
                    <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
                        {/* Summary Block */}
                        <div className="p-5 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Overall Present')}</p>
                                <p className="text-xs font-semibold text-gray-600 mt-0.5">{attendanceSummary.present || 0} {t('out of')} {attendanceSummary.total || 0} {t('days')}</p>
                            </div>
                            <div className={`text-3xl font-black ${attendanceTone}`}>{attendanceSummary.percentage || 0}%</div>
                        </div>
                        {/* 3-way Split */}
                        <div className="grid grid-cols-3 divide-x divide-gray-100">
                            <div className="p-4 text-center bg-emerald-50/30">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">{t('Present')}</p>
                                <p className="text-xl font-black text-emerald-700">{attendanceSummary.present || 0}</p>
                            </div>
                            <div className="p-4 text-center bg-rose-50/30">
                                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">{t('Absent')}</p>
                                <p className="text-xl font-black text-rose-700">{attendanceSummary.absent || 0}</p>
                            </div>
                            <div className="p-4 text-center bg-amber-50/30">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">{t('Late')}</p>
                                <p className="text-xl font-black text-amber-700">{attendanceSummary.late || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent List */}
                    {attendanceRecent.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('Recent Records')}</p>
                            {attendanceRecent.map((item, idx) => {
                                const subject = item.subjectId?.name || item.subjectName || 'Subject';
                                return (
                                    <div key={item._id || idx} className="flex items-center justify-between bg-white border border-gray-100 rounded-md px-4 py-3 shadow-sm">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{subject}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                {formatAttendanceDate(item.attendanceDate)}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${getAttendanceBadgeClass(item.status)}`}>
                                            {item.status || '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>


                <BatchDetailModal
                    isOpen={isBatchModalOpen}
                    onClose={() => setIsBatchModalOpen(false)}
                    batch={student.fullBatchData}
                    room={student.roomAllocation}
                />
            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
