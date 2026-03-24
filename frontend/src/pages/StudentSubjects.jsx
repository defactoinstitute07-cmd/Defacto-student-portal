import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import { ArrowLeft, Bell, Home as HomeIcon, Book as BookIcon, GraduationCap, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const StudentSubjects = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Ongoing');
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
        onError: () => setError(t('Failed to load subjects.'))
    });

    const subjects = student?.subjectTeachers || [];

    // Helper to determine exact styling based on the image's status types
    const getStatusTheme = (score) => {
        if (score === 0 || score < 40) {
            return {
                badgeBg: 'bg-red-50',
                badgeText: 'text-red-600',
                barColor: 'bg-red-500',
                label: 'NEEDS FOCUS',
                borderColor: 'border-red-500',
                showBorder: true
            };
        }
        if (score >= 40 && score < 75) {
            return {
                badgeBg: 'bg-blue-50',
                badgeText: 'text-blue-600',
                barColor: 'bg-[#191838]', // Dark Navy
                label: 'IN PROGRESS',
                borderColor: 'border-transparent',
                showBorder: false
            };
        }
        return {
            badgeBg: 'bg-indigo-50',
            badgeText: 'text-indigo-600',
            barColor: 'bg-[#191838]', // Dark Navy
            label: 'ON TRACK',
            borderColor: 'border-transparent',
            showBorder: false
        };
    };

    // Helper to generate the large initial for the circle
    const getSubjectInitial = (name) => {
        if (!name) return 'S';
        if (name.toLowerCase().includes('algorithm') || name.toLowerCase().includes('data structure')) return '< >';
        if (name.toLowerCase().includes('calculus') || name.toLowerCase().includes('math')) return '∑';
        return name.charAt(0).toUpperCase();
    };

    if (isLoading) {
        return (
            <StudentLayout title="Subject Hub">
                <div className="flex h-64 items-center justify-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="Subject Hub">
            <div 
                className="bg-white text-slate-900 pb-24" 
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
                {/* Tabs - Now part of the main page content below the layout header */}
                <div className="flex gap-6 border-b border-slate-100 px-6 pt-2 overflow-x-auto no-scrollbar">
                    {['Ongoing', 'Completed', 'Upcoming'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-[15px] font-semibold transition-colors whitespace-nowrap ${
                                activeTab === tab 
                                ? 'border-b-[2.5px] border-[#191838] text-[#191838]' 
                                : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                        >
                            {t(tab)}
                        </button>
                    ))}
                </div>

            <main className="px-5 pt-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[17px] font-bold tracking-tight text-[#191838]">{t('Your Academic Load')}</h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-500">
                        {t('Semester 4')}
                    </span>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {subjects.length > 0 ? (
                        subjects.map((s, idx) => {
                            const averageMarks = Number.isFinite(Number(s.averageMarks))
                                ? Math.max(0, Math.min(100, Number(s.averageMarks)))
                                : 0;
                            
                            const theme = getStatusTheme(averageMarks);
                            const teacherName = s.teacher === 'Unassigned' ? t('Unassigned') : s.teacher;
                            const initial = getSubjectInitial(s.subject);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => navigate(`/student/results/subject/${s.subject}`)}
                                    className={`relative w-full overflow-hidden rounded-[24px] bg-white p-5 text-left transition-transform active:scale-[0.98] ${
                                        theme.showBorder 
                                            ? 'border-[1.5px] border-red-100 shadow-sm' 
                                            : 'border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
                                    }`}
                                >
                                    {/* Right edge color strip for "Needs Focus" */}
                                    {theme.showBorder && (
                                        <div className="absolute bottom-0 right-0 top-0 w-1.5 bg-red-500" />
                                    )}

                                    <div className="flex items-start gap-4">
                                        {/* Subject Icon Circle (No Serif Font) */}
                                        <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[#191838] text-[22px] font-bold tracking-tighter">
                                            {initial}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-tight text-[#191838]">
                                                    {s.subject}
                                                </h3>
                                                <div className="flex flex-col items-end gap-1.1 shrink-0">
                                                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
                                                        {t(theme.label)}
                                                    </span>
                                                    {s.code && (
                                                        <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter border border-slate-100">
                                                            {s.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="mt-1 text-[13px] text-[#191838]">
                                                <span className="text-slate-400">{t('Faculty')}: </span>
                                                <span className="font-medium tracking-tight">{teacherName}</span>
                                            </p>

                                            <div className="mt-5 flex items-center justify-between text-[11px] font-bold tracking-wide">
                                                <span className="text-slate-500">{t('Overall Progress')}</span>
                                                <span className="text-[#191838]">{averageMarks}%</span>
                                            </div>

                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${theme.barColor}`}
                                                    style={{ width: `${averageMarks}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="rounded-[24px] border border-dashed border-slate-200 p-10 text-center">
                            <p className="font-semibold text-slate-500">{t('No subjects found')}</p>
                        </div>
                    )}
                </div>
            </main>

           
            {/* Safe area spacer for mobile browsers */}
            <style dangerouslySetInnerHTML={{ __html: `
                .pb-safe {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            ` }} />
        </div>
        </StudentLayout>
    );
};

export default StudentSubjects;