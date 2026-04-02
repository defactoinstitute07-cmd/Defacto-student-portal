import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, BookOpen } from 'lucide-react';

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
            badgeBg: 'bg-emerald-50',
            badgeText: 'text-emerald-600',
            barColor: 'bg-emerald-500',
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
            <div className="bg-slate-50 px-5 pt-6 pb-24 no-scrollbar scroll-smooth min-h-screen">
                <Skeleton className="h-32 w-full rounded-[28px] mb-6" />
                <div className="flex gap-6 border-b border-slate-100 mb-6">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-10 w-24 mb-3" />
                    ))}
                </div>
                <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="space-y-5">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-32 w-full rounded-[24px]" />
                    ))}
                </div>
            </div>
        );
    }

    const overallAverage = subjects.length > 0
        ? Math.round(subjects.reduce((sum, s) => {
            const marks = Number.isFinite(Number(s.averageMarks)) ? Number(s.averageMarks) : 0;
            return sum + Math.max(0, Math.min(100, marks));
        }, 0) / subjects.length)
        : 0;

    const onTrackCount = subjects.filter((s) => {
        const marks = Number.isFinite(Number(s.averageMarks)) ? Number(s.averageMarks) : 0;
        return marks >= 75;
    }).length;

    return (
        <div 
            className="bg-[radial-gradient(circle_at_top_right,#dbeafe_0%,#f8fafc_28%,#ffffff_100%)] text-slate-900 pb-24 min-h-screen" 
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            <main className="p0">
                <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
                    <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-blue-100/60" />
                    <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-emerald-100/40" />

                    <div className="relative">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{t('Subject Overview')}</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#191838] sm:text-3xl">{t('Your Academic Load')}</h2>
                        <p className="mt-2 max-w-xl text-sm text-slate-600">
                            {t('Open any subject to view chapter-wise progress, marks, and teacher feedback.')}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold tracking-wide text-slate-600 border border-slate-200">
                                {t('Semester 4')}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold tracking-wide text-indigo-700 border border-indigo-100">
                                {subjects.length} {t('Subjects')}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('Total')}</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{subjects.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('On Track')}</p>
                        <p className="mt-2 text-xl font-black text-emerald-700">{onTrackCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('Average')}</p>
                        <p className="mt-2 text-xl font-black text-[#191838]">{overallAverage}%</p>
                    </div>
                </section>

                {/* Tabs */}
                <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
                    {['Ongoing', 'Completed'].map((tab) => {
                        const count = tab === 'Completed'
                            ? subjects.filter(s => (s.syllabus?.completionPercentage || 0) === 100).length
                            : subjects.filter(s => (s.syllabus?.completionPercentage || 0) < 100).length;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-wider transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
                                    activeTab === tab
                                        ? 'bg-[#191838] text-white border-[#191838]'
                                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {tab === 'Completed' && <CheckCircle2 size={13} />}
                                {t(tab)}
                                <span className={`ml-0.5 text-[10px] rounded-full px-1.5 py-0.5 font-black ${
                                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-4 mt-5">
                    {(() => {
                        const filteredSubjects = activeTab === 'Completed'
                            ? subjects.filter(s => (s.syllabus?.completionPercentage || 0) === 100)
                            : subjects.filter(s => (s.syllabus?.completionPercentage || 0) < 100);

                        if (filteredSubjects.length === 0) {
                            return (
                                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
                                    <div className="flex justify-center mb-3">
                                        {activeTab === 'Completed'
                                            ? <CheckCircle2 size={32} className="text-slate-300" />
                                            : <BookOpen size={32} className="text-slate-300" />
                                        }
                                    </div>
                                    <p className="font-semibold text-slate-500">
                                        {activeTab === 'Completed'
                                            ? t('No subjects with completed syllabus yet')
                                            : t('No subjects found')}
                                    </p>
                                    {activeTab === 'Completed' && (
                                        <p className="mt-2 text-xs text-slate-400">
                                            {t('Subjects will appear here when all chapters are marked as completed.')}
                                        </p>
                                    )}
                                </div>
                            );
                        }

                        return filteredSubjects.map((s, idx) => {
                            const averageMarks = Number.isFinite(Number(s.averageMarks))
                                ? Math.max(0, Math.min(100, Number(s.averageMarks)))
                                : 0;
                            
                            const theme = getStatusTheme(averageMarks);
                            const teacherName = s.teacher === 'Unassigned' ? t('Unassigned') : s.teacher;
                            const initial = getSubjectInitial(s.subject);

                            // Syllabus progress
                            const syllabusData = s.syllabus || {};
                            const totalCh = syllabusData.totalChapters || syllabusData.chapters?.length || 0;
                            const completedCh = syllabusData.completedChapters || syllabusData.chapters?.filter(c => c.isCompleted).length || 0;
                            const syllPct = syllabusData.completionPercentage ?? (totalCh > 0 ? Math.round((completedCh / totalCh) * 100) : 0);
                            const isFullyCompleted = syllPct === 100;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => navigate(`/student/results/subject/${s.subject}`)}
                                    className={`group relative w-full overflow-hidden rounded-[26px] bg-white p-5 text-left transition-all duration-300 active:scale-[0.98] hover:-translate-y-0.5 ${
                                        isFullyCompleted
                                            ? 'border border-emerald-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_rgba(16,185,129,0.12)]'
                                            : theme.showBorder 
                                                ? 'border-[1.5px] border-red-100 shadow-sm hover:shadow-[0_16px_30px_rgba(239,68,68,0.14)]' 
                                                : 'border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]'
                                    }`}
                                >
                                    {/* Right edge color strip for "Needs Focus" */}
                                    {!isFullyCompleted && theme.showBorder && (
                                        <div className="absolute bottom-0 right-0 top-0 w-1.5 bg-red-500" />
                                    )}

                                    {isFullyCompleted ? (
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-90" />
                                    ) : !theme.showBorder && (
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 opacity-80" />
                                    )}

                                    <div className="flex items-start gap-4">
                                        {/* Subject Icon Circle */}
                                        <div className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl text-[22px] font-bold tracking-tighter border transition-colors ${
                                            isFullyCompleted
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100'
                                                : 'bg-slate-100 text-[#191838] border-slate-200 group-hover:bg-slate-200'
                                        }`}>
                                            {isFullyCompleted ? <CheckCircle2 size={24} /> : initial}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-tight text-[#191838]">
                                                    {s.subject}
                                                </h3>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    {isFullyCompleted ? (
                                                        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
                                                            {t('Syllabus Done')}
                                                        </span>
                                                    ) : (
                                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${theme.badgeBg} ${theme.badgeText} ${theme.showBorder ? 'border-red-200' : 'border-transparent'}`}>
                                                            {t(theme.label)}
                                                        </span>
                                                    )}
                                                    {s.code && (
                                                        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter border border-slate-100">
                                                            {s.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="mt-1 text-[13px] text-[#191838]">
                                                <span className="text-slate-400">{t('Faculty')}: </span>
                                                <span className="font-medium tracking-tight">{teacherName}</span>
                                            </p>

                                            {/* Syllabus Chapter Progress */}
                                            {totalCh > 0 && (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${
                                                                isFullyCompleted ? 'bg-emerald-500' :
                                                                syllPct >= 50 ? 'bg-amber-500' : 'bg-indigo-500'
                                                            }`}
                                                            style={{ width: `${syllPct}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-black whitespace-nowrap ${
                                                        isFullyCompleted ? 'text-emerald-600' : 'text-slate-400'
                                                    }`}>
                                                        {completedCh}/{totalCh} {t('Ch')}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-3 flex items-center justify-between text-[11px] font-bold tracking-wide">
                                                <span className="text-slate-500">{t('Overall Progress')}</span>
                                                <span className={averageMarks >= 75 ? 'text-emerald-700' : 'text-[#191838]'}>{averageMarks}%</span>
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
                        });
                    })()}
                </div>
            </main>

           
            {/* Safe area spacer for mobile browsers */}
            <style dangerouslySetInnerHTML={{ __html: `
                .pb-safe {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            ` }} />
        </div>
    );
};

export default StudentSubjects;