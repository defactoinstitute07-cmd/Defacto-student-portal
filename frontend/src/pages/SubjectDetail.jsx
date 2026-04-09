import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Award, TrendingDown, BookOpen, AlertTriangle,
    ChevronLeft, Clock, RefreshCcw, ChevronDown,
    Calendar, CheckCircle2, XCircle, Info, User,
    FileText, Hash, CheckCircle, ChevronRight, MapPin, MoreVertical, ArrowLeft,
    ClipboardList, Target, GraduationCap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const resolvePassingMarks = (exam = {}) => {
    const passingMarks = Number(exam?.passingMarks);
    if (Number.isFinite(passingMarks) && passingMarks >= 0) {
        return passingMarks;
    }

    const totalMarks = Number(exam?.totalMarks);
    if (Number.isFinite(totalMarks) && totalMarks > 0) {
        return totalMarks * 0.4;
    }

    return 40;
};

const hasExamPassed = (exam = {}) => {
    if (typeof exam?.hasPassed === 'boolean') return exam.hasPassed;

    const marksObtained = Number(exam?.marksObtained);
    if (Number.isFinite(marksObtained)) {
        return marksObtained >= resolvePassingMarks(exam);
    }

    const totalMarks = Number(exam?.totalMarks);
    if (Number.isFinite(totalMarks) && totalMarks > 0) {
        return Number(exam?.percentage || 0) >= (resolvePassingMarks(exam) / totalMarks) * 100;
    }

    return Number(exam?.percentage || 0) >= 40;
};

const getExamSubjectLabel = (exam = {}, fallbackSubject = '') => {
    const label = String(exam?.subject || fallbackSubject || '').trim();
    return label || '---';
};

const formatExamDate = (value, language) => {
    if (!value) return '---';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '---';

    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const formatMarksValue = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '---';
    return Number.isInteger(numeric) ? String(numeric) : String(Number(numeric.toFixed(2)));
};

const SubjectDetail = () => {
    const { subjectName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const resolvedSubjectName = useMemo(() => {
        try {
            return decodeURIComponent(String(subjectName || '')).trim();
        } catch {
            return String(subjectName || '').trim();
        }
    }, [subjectName]);

    const normalizeId = (value) => {
        if (!value) return null;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed || null;
        }

        if (typeof value === 'object') {
            const objectId = value._id || value.id || value.$oid;
            if (typeof objectId === 'string' && objectId.trim()) return objectId.trim();
        }

        return null;
    };

    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const requestedSubjectId = useMemo(() => normalizeId(searchParams.get('subjectId')), [searchParams]);
    const requestedBatchId = useMemo(() => normalizeId(searchParams.get('batchId')), [searchParams]);

    const normalizeSubjectKey = (value = '') => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const [activeTab, setActiveTab] = useState('Results');
    const [resultViewTab, setResultViewTab] = useState('Upcoming');
    const [selectedTest, setSelectedTest] = useState(null);
    const [teacherImageFailed, setTeacherImageFailed] = useState(false);
    const token = localStorage.getItem('studentToken');

    useEffect(() => {
        if (!token) navigate('/student/login');
    }, [navigate, token]);

    const { data: student, isLoading: studentLoading } = useQuery({
        queryKey: ['student', 'me'],
        enabled: !!token,
        queryFn: async () => {
            const res = await api.get('/student/me');
            if (res.data.success) {
                setCached('student.me', res.data.student);
                return res.data.student;
            }
            throw new Error('Failed');
        }
    });

    const { data: liveSubjectResponse, isLoading: subjectLoading, error: subjectFetchError } = useQuery({
        queryKey: ['subject', resolvedSubjectName, requestedSubjectId, requestedBatchId],
        enabled: !!token && (!!resolvedSubjectName || !!requestedSubjectId),
        queryFn: async () => {
            const subjectLookupKey = resolvedSubjectName || requestedSubjectId;
            const params = {};
            if (requestedSubjectId) params.subjectId = requestedSubjectId;
            if (requestedBatchId) params.batchId = requestedBatchId;

            const res = await api.get(`/student/subject/${encodeURIComponent(subjectLookupKey)}`, {
                params
            });
            return res.data;
        },
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true
    });

    const legacySubjectData = useMemo(() => {
        const resolvedSubjects = Array.isArray(student?.subjects) ? student.subjects : [];
        const subjectTeachers = Array.isArray(student?.subjectTeachers) ? student.subjectTeachers : [];
        const batchSubjectsFallback = Array.isArray(student?.fullBatchData?.subjects)
            ? student.fullBatchData.subjects.map((name) => ({ subject: name, name }))
            : [];

        const allSubjects = resolvedSubjects.length > 0
            ? resolvedSubjects
            : (subjectTeachers.length > 0 ? subjectTeachers : batchSubjectsFallback);

        if (requestedSubjectId) {
            const matchById = allSubjects.find((entry) => {
                const candidateId = normalizeId(
                    entry?.subjectId
                    || entry?._id
                    || entry?.id
                    || entry?.subject?._id
                    || entry?.subject?.id
                );
                return candidateId === requestedSubjectId;
            });

            if (matchById) return matchById;
        }

        const target = normalizeSubjectKey(resolvedSubjectName);
        return allSubjects.find((s) => normalizeSubjectKey(s.subject || s.name) === target);
    }, [student, resolvedSubjectName, requestedSubjectId]);
    const subjectData = liveSubjectResponse?.subject || legacySubjectData || null;
    const faculty = subjectData?.teacher || legacySubjectData?.teacher || t('Unassigned');

    useEffect(() => {
        setTeacherImageFailed(false);
    }, [subjectData?.teacherProfileImage, faculty]);

    const teacherAvatar = useMemo(() => {
        const fallback = `https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png`;
        if (teacherImageFailed) return fallback;

        const raw = String(subjectData?.teacherProfileImage || '').trim();
        if (!raw) return fallback;
        if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;

        const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;
        if (normalizedPath.startsWith('/uploads')) {
            return normalizedPath;
        }

        if (normalizedPath.startsWith('/')) {
            return normalizedPath;
        }

        return fallback;
    }, [subjectData?.teacherProfileImage, faculty, teacherImageFailed]);

    const attendanceInfo = useMemo(() => {
        const target = normalizeSubjectKey(resolvedSubjectName);
        return student?.attendanceSubjects?.find((s) => normalizeSubjectKey(s.subjectName) === target) || {
            percentage: 0,
            present: 0,
            absent: 0,
            late: 0,
            total: 0
        };
    }, [student, resolvedSubjectName]);

    const attendanceProgress = attendanceInfo.percentage;

    const subjectId = useMemo(() => {
        if (subjectData?._id) return subjectData._id;
        if (!student) return null;
        const target = normalizeSubjectKey(resolvedSubjectName);
        return student.attendanceSubjects?.find((s) => normalizeSubjectKey(s.subjectName) === target)?.subjectId;
    }, [student, resolvedSubjectName, subjectData]);

    const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
        queryKey: ['student', 'attendance', subjectId],
        enabled: !!subjectId,
        queryFn: async () => {
            const res = await api.get(`/student/attendance/subject/${subjectId}`);
            return res.data;
        }
    });

    const filteredResults = useMemo(() => {
        if (!subjectData?.exams) return [];
        return subjectData.exams.filter((e) => {
            const normalizedType = String(e?.type || 'Exam').trim().toLowerCase();
            return ['exam', 'quiz', 'assignment'].includes(normalizedType);
        });
    }, [subjectData]);

    const isScheduledTest = (exam) => {
        const status = String(exam?.status || '').trim().toLowerCase();
        if (status === 'cancelled') return false;
        if (status === 'scheduled') return true;

        if (!exam?.date) return false;
        const examDate = new Date(exam.date);
        if (Number.isNaN(examDate.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return examDate.getTime() >= today.getTime();
    };

    const hasPassedTest = (exam) => {
        return hasExamPassed(exam);
    };

    const hasDeclaredResult = (exam) => {
        return exam?.marksObtained !== null && exam?.marksObtained !== undefined;
    };

    const upcomingResults = useMemo(
        () => filteredResults.filter((e) => !hasDeclaredResult(e) && isScheduledTest(e)),
        [filteredResults]
    );

    const completedResults = useMemo(
        () => filteredResults.filter((e) => !( !hasDeclaredResult(e) && isScheduledTest(e) )),
        [filteredResults]
    );

    const visibleResults = resultViewTab === 'Upcoming' ? upcomingResults : completedResults;

    if (studentLoading || (subjectLoading && !subjectData)) return (
        <StudentLayout title={resolvedSubjectName}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCcw className="animate-spin text-[#191838]" size={36} />
            </div>
        </StudentLayout>
    );

    if (!subjectData) {
        const unauthorized = subjectFetchError?.response?.status === 401 || subjectFetchError?.response?.status === 403;
        return (
            <StudentLayout title={resolvedSubjectName}>
                <div className="flex min-h-[60vh] items-center justify-center px-4">
                    <div className="w-full max-w-[420px] rounded-[15px] border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-sm font-bold text-red-700">
                            {unauthorized
                                ? t('You are not authorized to view this subject.')
                                : t('Unable to load this subject right now. Please try again shortly.')}
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/student/results')}
                            className="mt-4 inline-flex items-center rounded-[12px] bg-[#191838] px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
                        >
                            {t('Back to Results')}
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const tabs = [
        { id: 'Results', label: t('Exam'), icon: Award },
        { id: 'Syllabus', label: t('Syllabus'), icon: BookOpen },
        { id: 'Info', label: t('Info'), icon: Info }
    ];

    return (
        <StudentLayout title={resolvedSubjectName} backUrl="/student/results" useHistoryBack hideMobileNav>
            <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#e0f2fe_0%,#f8fafc_36%,#f1f5f9_100%)] pb-24 font-sans selection:bg-indigo-100">


                <main className="mx-auto max-w-[420px]  pt-3 space-y-4">
                    {/* Subject Hero */}
                    <section className="relative overflow-hidden   rounded-[10px] border border-slate-200/80 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                        <div className="absolute -top-16 -right-12 h-36 w-36   rounded-[10px] bg-indigo-100/70 blur-2xl" />
                        <div className="absolute -bottom-16 -left-14 h-40 w-40   rounded-[10px] bg-emerald-100/50 blur-2xl" />

                        <div className="relative">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{t('Subject Detail')}</p>
                            <h2 className="mt-2 text-[1.55rem] leading-tight font-black tracking-tight text-[#191838] break-words">{subjectData?.name || resolvedSubjectName}</h2>
                            <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">{t('Track results, attendance, and faculty updates in one place.')}</p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="inline-flex items-center   rounded-[10px] border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700">
                                    {faculty}
                                </span>
                                <span className="inline-flex items-center   rounded-[10px] border border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                                    {subjectData?.code || 'TBD'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Attendance Summary Section - Always Visible at Top as requested */}
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-white   rounded-[10px] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[12px] font-black text-[#191838] uppercase tracking-[0.16em] flex items-center gap-2">
                                    <GraduationCap size={16} className="text-indigo-500" />
                                    {t('Attendance Overview')}
                                </h3>
                                <span className={`px-3 py-1   rounded-[10px] text-[11px] font-black ${attendanceProgress >= 75 ? 'bg-emerald-50 text-emerald-600' :
                                        attendanceProgress >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                    }`}>
                                    {attendanceProgress}%
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="bg-slate-50   rounded-[10px] p-3 text-center border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.16em] mb-1">{t('Present')}</p>
                                    <p className="text-[15px] font-black text-emerald-600">{attendanceInfo.present}</p>
                                </div>
                                <div className="bg-slate-50   rounded-[10px] p-3 text-center border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.16em] mb-1">{t('Absent')}</p>
                                    <p className="text-[15px] font-black text-rose-600">{attendanceInfo.absent + attendanceInfo.late}</p>
                                </div>
                                <div className="bg-slate-50   rounded-[10px] p-3 text-center border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.16em] mb-1">{t('Total')}</p>
                                    <p className="text-[15px] font-black text-[#191838]">{attendanceInfo.total}</p>
                                </div>
                            </div>

                            <div className="mt-4 h-1.5 w-full bg-slate-100   rounded-[10px] overflow-hidden">
                                <div
                                    className={`h-full   rounded-[10px] transition-all duration-1000 ${attendanceProgress >= 75 ? 'bg-emerald-500' :
                                            attendanceProgress >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                    style={{ width: `${attendanceProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Custom Tab Bar (iOS Segmented Control Style) Moved Below Attendance */}
                    <div className="sticky top-[-6px] z-40 py-1.5">
                        <div className="flex bg-white/92 backdrop-blur-md border border-slate-200 p-1 rounded-[6px] shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5  rounded-[10px] text-[11px] font-black transition-all ${activeTab === tab.id
                                                ? 'bg-[#191838] text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content Section */}
                    {/* 1. SYLLABUS TAB CONTENT */}
                {activeTab === 'Syllabus' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                        {(() => {
                            const syllabus = subjectData?.syllabus;
                            const chapters = syllabus?.chapters || [];
                            const totalChapters = syllabus?.totalChapters || chapters.length;
                            const completedChapters = syllabus?.completedChapters || chapters.filter(c => c.isCompleted).length;
                            const completionPct = syllabus?.completionPercentage ?? (totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0);
                            const trackedChapters = syllabus?.tracking?.trackedChapters ?? chapters.filter(c => c.isCompletionTracked).length;
                            const untrackedChapters = syllabus?.tracking?.untrackedChapters ?? Math.max(totalChapters - trackedChapters, 0);
                            const remainingChapters = Math.max(totalChapters - completedChapters, 0);
                            const now = Date.now();
                            const getChapterTime = (value) => {
                                if (!value) return null;
                                const parsed = new Date(value).getTime();
                                return Number.isNaN(parsed) ? null : parsed;
                            };
                            const getChapterRawStatus = (chapter) => String(chapter?.status || '').trim().toLowerCase();
                            const isChapterCompleted = (chapter) => {
                                const rawStatus = getChapterRawStatus(chapter);
                                return chapter?.isCompleted === true || rawStatus === 'completed';
                            };
                            const activeChapterIndex = (() => {
                                const explicitOngoingIndex = chapters.findIndex((chapter) => {
                                    if (isChapterCompleted(chapter)) return false;
                                    return getChapterRawStatus(chapter) === 'ongoing';
                                });
                                if (explicitOngoingIndex !== -1) return explicitOngoingIndex;

                                const scheduledActiveIndex = chapters.findIndex((chapter) => {
                                    if (isChapterCompleted(chapter)) return false;
                                    const projectedStart = getChapterTime(chapter?.projectedStartDate);
                                    return projectedStart === null || projectedStart <= now;
                                });
                                if (scheduledActiveIndex !== -1) return scheduledActiveIndex;

                                return chapters.findIndex((chapter) => !isChapterCompleted(chapter));
                            })();
                            const getChapterDisplayState = (chapter, index) => {
                                if (isChapterCompleted(chapter)) return 'completed';

                                if (index === activeChapterIndex) {
                                    return 'ongoing';
                                }

                                return 'upcoming';
                            };

                            const completionDates = chapters
                                .filter((chapter) => chapter.isCompleted && chapter.completedAt)
                                .map((chapter) => new Date(chapter.completedAt))
                                .filter((date) => !Number.isNaN(date.getTime()))
                                .sort((a, b) => a.getTime() - b.getTime());

                            let avgDaysPerChapter = 4;
                            if (completionDates.length >= 2) {
                                let totalGapDays = 0;
                                for (let i = 1; i < completionDates.length; i += 1) {
                                    const diffMs = completionDates[i].getTime() - completionDates[i - 1].getTime();
                                    totalGapDays += Math.max(diffMs / (1000 * 60 * 60 * 24), 1);
                                }
                                avgDaysPerChapter = Math.max(Math.round(totalGapDays / (completionDates.length - 1)), 1);
                            } else if (completionDates.length === 1) {
                                avgDaysPerChapter = 3;
                            }

                            const nextChapterEstimateDays = completionPct >= 100 ? 0 : avgDaysPerChapter;

                            if (chapters.length === 0 && totalChapters === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="mb-6 flex h-20 w-20 items-center justify-center   rounded-[10px] bg-slate-50 text-slate-300">
                                            <ClipboardList size={40} />
                                        </div>
                                        <h4 className="text-xl font-bold text-[#191838]">{t('No Syllabus Data')}</h4>
                                        <p className="mt-3 text-sm font-medium text-slate-400 leading-relaxed max-w-[240px]">
                                            {t('The syllabus for this subject has not been added yet. Please check back later.')}
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    {/* Chapter Tracking Dashboard */}
                                    <div className="overflow-hidden rounded-[15px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
             

                                        <div className="p-4">
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div className="   rounded-[10px] border border-slate-200 bg-slate-50 p-3">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{t('Total Chapters')}</p>
                                                    <p className="mt-1 text-[16px] font-black text-slate-800">{totalChapters}</p>
                                                </div>
                                                <div className="   rounded-[10px] border border-emerald-200 bg-emerald-50 p-3">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">{t('Completed Chapters')}</p>
                                                    <p className="mt-1 text-[16px] font-black text-emerald-700">{completedChapters}</p>
                                                </div>
                                                <div className="   rounded-[10px] border border-amber-200 bg-amber-50 p-3">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-600">{t('Remaining Chapters')}</p>
                                                    <p className="mt-1 text-[16px] font-black text-amber-700">{remainingChapters}</p>
                                                </div>
                                                <div className="   rounded-[10px] border border-blue-200 bg-blue-50 p-3">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">{t('Next Chapter ETA')}</p>
                                                    <p className="mt-1 text-[16px] font-black text-blue-700">
                                                        {nextChapterEstimateDays === 0 ? t('Completed') : `${nextChapterEstimateDays} ${t('days')}`}
                                                    </p>
                                                </div>
                                            </div>

                                           

                                          
                                        </div>
                                    </div>

                                    {/* Chapter List */}
                                    <div className="rounded-[15px] border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                                        <div className="mb-3 flex items-center justify-between px-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{t('Upcoming Chapters')}</p>
                                            <span className="   rounded-[10px] bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
                                                {totalChapters} {t('Total')}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                        {chapters.length > 0 ? chapters.map((chapter, idx) => (
                                          (() => {
                                              const chapterDisplayState = getChapterDisplayState(chapter, idx);
                                              const isCompletedChapter = chapterDisplayState === 'completed';
                                              const isOngoingChapter = chapterDisplayState === 'ongoing';

                                              return (
                                          <div
    key={chapter._id || idx}
    className={`p-4 rounded-xl border transition-all hover:shadow-md ${
        isCompletedChapter
            ? 'bg-emerald-50/40 border-emerald-200'
            : isOngoingChapter
                ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-100'
                : 'bg-white border-slate-200'
    }`}
>
    {/* Main Container: Column on mobile, Row on tablet/desktop */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        
        {/* Left Section: Status Circle & Chapter Name */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Status Circle */}
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                isCompletedChapter
                    ? 'bg-emerald-100 border-emerald-200 text-emerald-600'
                    : isOngoingChapter
                        ? 'bg-blue-100 border-blue-200 text-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
                {isCompletedChapter
                    ? <CheckCircle size={20} />
                    : <span className="text-sm font-bold">{idx + 1}</span>
                }
            </div>

            {/* Chapter Info */}
            <div className="flex-1 min-w-0 pt-0.5">
                <h4 className={`text-sm sm:text-base font-semibold leading-tight truncate ${
                    isCompletedChapter ? 'text-emerald-900' : isOngoingChapter ? 'text-blue-900' : 'text-slate-800'
                }`}>
                    {chapter.name}
                </h4>
                
                <p className={`mt-1 text-xs font-medium ${
                    isCompletedChapter ? 'text-emerald-600' : isOngoingChapter ? 'text-blue-600' : 'text-slate-500'
                }`}>
                    {isCompletedChapter
                        ? `${t('Completed')} ${chapter.completedAt ? new Date(chapter.completedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}`
                        : isOngoingChapter
                            ? t('Ongoing')
                            : t('Upcoming')
                    }
                </p>
            </div>
        </div>

        {/* Right/Bottom Section: Badges (Wraps nicely on mobile) */}
        <div className="flex flex-wrap items-center gap-2 pl-[54px] sm:pl-0 sm:justify-end">
            {/* Duration / Assigned Badge */}
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                ⏱️ {Number(chapter.durationDays || 0)} {t('days')}
            </span>

            {/* Projected Completion Badge */}
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm ${
                isCompletedChapter
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : isOngoingChapter
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : chapter.projectedCompletionDate
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>
                {isCompletedChapter
                    ? t('Done')
                    : isOngoingChapter && chapter.projectedCompletionDate
                        ? `${t('In')} ${Math.max(Math.ceil((new Date(chapter.projectedCompletionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0)} ${t('days')}`
                        : isOngoingChapter
                            ? t('Ongoing')
                            : chapter.projectedCompletionDate
                        ? `${t('In')} ${Math.max(Math.ceil((new Date(chapter.projectedCompletionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0)} ${t('days')}`
                        : `${t('In')} ${Number(chapter.durationDays || 0)} ${t('days')}`
                }
            </span>

            {/* Tracking Badge */}
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm hidden sm:inline-flex ${
                chapter.isCompletionTracked
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
                {chapter.isCompletionTracked ? t('Tracked') : t('Not tracked')}
            </span>
        </div>
    </div>
</div>
                                              );
                                          })()
)) : (
                                            <div className="rounded-[15px] border border-amber-200 bg-amber-50 p-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">{t('Upcoming Chapters')}</p>
                                                <p className="mt-1 text-xs font-semibold text-amber-700">
                                                    {t('Chapter list is not available yet, but overall chapter targets are active for this subject.')}
                                                </p>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                    {/* 2. RESULTS TAB CONTENT */}
                    {activeTab === 'Results' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            {/* Result visibility tabs */}
                            <div className="flex gap-2 mb-6   rounded-[10px] border border-slate-200 bg-white p-1 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setResultViewTab('Upcoming')}
                                    className={`flex-1 py-2.5   rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all ${resultViewTab === 'Upcoming'
                                            ? 'bg-[#191838] text-white shadow-lg shadow-indigo-100'
                                            : 'text-slate-500'
                                        }`}
                                >
                                    {t('Upcoming')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResultViewTab('Completed')}
                                    className={`flex-1 py-2.5   rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all ${resultViewTab === 'Completed'
                                            ? 'bg-[#191838] text-white shadow-lg shadow-indigo-100'
                                            : 'text-slate-500'
                                        }`}
                                >
                                    {t('Completed')}
                                </button>
                            </div>

                            {resultViewTab === 'Upcoming' && visibleResults.length > 0 && (
                                <div className="mb-4   rounded-[10px] border border-blue-200 bg-blue-50/70 p-4">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <Clock size={16} />
                                        <p className="text-xs font-black uppercase tracking-[0.18em]">{t('Upcoming Schedule')}</p>
                                    </div>
                                    <p className="mt-1.5 text-xs font-medium text-blue-600">
                                        {t('These are scheduled tests. Scores and percentages will appear after results are declared.')}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {visibleResults.length > 0 ? (
                                    visibleResults.map((e, idx) => (
                                        (() => {
                                            const isUpcoming = !hasDeclaredResult(e) && isScheduledTest(e);
                                            const isResultPending = !isUpcoming && !hasDeclaredResult(e);
                                            const hasPassed = hasPassedTest(e);
                                            const subjectLabel = getExamSubjectLabel(e, subjectData?.name || resolvedSubjectName);
                                            const scheduledDateLabel = formatExamDate(e.date, language);
                                            const totalMarksLabel = formatMarksValue(e.totalMarks);
                                            const passingMarksLabel = formatMarksValue(resolvePassingMarks(e));
                                            return (
                                            <div
    key={e._id || idx}
    onClick={() => setSelectedTest({
        ...e,
        subject: subjectLabel,
        passingMarks: resolvePassingMarks(e)
    })}
    className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group cursor-pointer transition-all active:scale-[0.98] shadow-sm ${
        isUpcoming
            ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-100 sm:hover:shadow-md sm:hover:border-blue-300'
            : isResultPending
                ? 'bg-amber-50/55 border-amber-200 sm:hover:shadow-md sm:hover:border-amber-300'
            : hasPassed
                ? 'bg-emerald-50/40 border-emerald-200 sm:hover:shadow-md sm:hover:border-emerald-300'
                : 'bg-rose-50/35 border-rose-200 sm:hover:shadow-md sm:hover:border-rose-300'
    }`}
>
{/* Left Section: Icon & Details */}
<div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
    
    {/* Icon */}
    <div className={`p-2.5 sm:p-3 shrink-0 rounded-xl border ${
        isUpcoming
            ? 'bg-blue-100 text-blue-700 border-blue-200'
            : isResultPending
                ? 'bg-amber-100 text-amber-700 border-amber-200'
            : hasPassed
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-rose-100 text-rose-700 border-rose-200'
    }`}>
        {isUpcoming ? <Calendar size={20} /> : isResultPending ? <CheckCircle2 size={20} /> : <Award size={20} />}
    </div>
    
    {/* Details */}
    <div className="min-w-0 flex-1 pt-0.5">
        <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate pr-2">
            {e.name}
        </h4>
        <p className={`mt-0.5 text-xs font-medium truncate ${
            isUpcoming ? 'text-blue-600' : isResultPending ? 'text-amber-600' : 'text-slate-500'
        }`}>
            {/* Added logic for 'Attempted on' if result is pending */}
            {isUpcoming ? `${t('Scheduled on')} ` : isResultPending ? `${t('Attempted on')} ` : ''}
            {new Date(e.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {e.chapter}
        </p>
        
        {/* Status Pills / Debug */}
        <div className="flex flex-wrap gap-2 mt-2">
            
            {/* FIX: Changed text from 'Result Pending' to 'Upcoming' */}
            {isUpcoming && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 shadow-sm">
                    <Clock size={12} />
                    {t('Upcoming')}
                </div>
            )}

            {isResultPending && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 shadow-sm">
                    <CheckCircle2 size={12} />
                    {t('Result Pending')}
                </div>
            )}

            {import.meta.env.DEV && resultViewTab === 'Upcoming' && (
                <div className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800 shadow-sm">
                    DBG: {String(e?.type || 'N/A')} | {String(e?.status || 'N/A')}
                </div>
            )}
            
        </div>
    </div>
</div>

    {/* Right Section: Scores/Status (Moves to bottom-left on mobile) */}
    <div className="pl-[52px] sm:pl-0 sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center mt-1 sm:mt-0">
        {isUpcoming ? (
            <>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{t('Upcoming')}</p>
                <p className="text-[11px] font-semibold text-blue-500 mt-0.5">{t('Upcoming')}</p>
            </>
        ) : isResultPending ? (
            <>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">{t('Completed')}</p>
                <p className="text-[11px] font-semibold text-amber-600 mt-0.5">{t('Result Pending')}</p>
            </>
        ) : (
            <>
                <div className="flex items-baseline gap-1 sm:block">
                    <p className="text-base sm:text-lg font-black text-slate-900">{e.marksObtained}</p>
                    <p className="text-xs font-bold text-slate-500 sm:hidden">/ {e.totalMarks}</p>
                </div>
                <p className="hidden sm:block text-xs font-bold text-slate-500 mt-0.5">
                    {t('Out of')} {e.totalMarks}
                </p>
                
                <p className={`text-xs font-bold uppercase tracking-wide mt-1 ${hasPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {e.percentage}% • {hasPassed ? t('Passed') : t('Failed')}
                </p>
            </>
        )}
    </div>
</div>
                                            );
                                        })()
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center    rounded-[10px]  border-2 border-dashed border-slate-200 bg-white/70 p-12 text-center shadow-sm">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center   rounded-[10px] bg-slate-100 text-slate-400">
                                            <FileText size={28} />
                                        </div>
                                        <h4 className="text-lg font-bold text-[#191838]">
                                            {resultViewTab === 'Upcoming' ? t('No Upcoming Tests') : t('No Completed Tests')}
                                        </h4>
                                        <p className="mt-2 text-sm font-medium text-slate-400 leading-relaxed max-w-[200px]">
                                            {resultViewTab === 'Upcoming'
                                                ? t('Upcoming tests will appear here once they are scheduled.')
                                                : t('Completed tests will appear here once the exam cycle finishes.')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. INFORMATION TAB CONTENT */}
                    {activeTab === 'Info' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* Faculty Profile Card */}
                            <div className="relative overflow-hidden rounded-[15px] bg-gradient-to-br from-[#1e2a58] via-[#1f356f] to-[#191838] p-6 text-white shadow-xl">
                                <div className="flex items-center gap-5">
                                    <div className="h-20 w-20 overflow-hidden rounded-[15px] border-2 border-white/20 bg-white/10">
                                        <img
                                            src={teacherAvatar}
                                            alt="Faculty"
                                            className="h-full w-full object-cover"
                                            onError={() => setTeacherImageFailed(true)}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{t('Lead Faculty')}</p>
                                        <p className="text-xl font-bold">{faculty}</p>
                                  
                                    </div>
                                </div>
                            </div>

                            {/* Schedule & Attendance Group */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5   rounded-[10px] bg-white border border-slate-100 shadow-sm text-center">
                                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600   rounded-[10px] flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                                        <Hash size={20} />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Subject Code')}</p>
                                    <p className="text-sm font-bold text-[#191838]">{subjectData?.code || '---'}</p>
                                </div>
                                <div className="p-5   rounded-[10px] bg-white border border-slate-100 shadow-sm text-center">
                                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600   rounded-[10px] flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                                        <GraduationCap size={20} />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Attendance')}</p>
                                    <p className="text-sm font-bold text-emerald-600">{attendanceProgress}%</p>
                                </div>
                            </div>

                            {/* Attendance Detail (Simplified Calendar) */}
                            <div className="p-6 rounded-[15px] bg-white border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar size={18} className="text-slate-400" />
                                    <h4 className="text-sm font-bold text-[#191838]">{t('Detailed Logs')}</h4>
                                </div>
                                {attendanceLoading ? (
                                    <div className="flex h-40 items-center justify-center"><RefreshCcw className="animate-spin text-slate-100" /></div>
                                ) : (
                                    <CalendarView records={attendanceData?.records || []} t={t} language={language} />
                                )}
                            </div>
                        </div>
                    )}
                </main>

                {/* Test Detail Modal */}
                <TestDetailModal
                    test={selectedTest}
                    onClose={() => setSelectedTest(null)}
                    t={t}
                    language={language}
                    fallbackSubjectName={subjectData?.name || resolvedSubjectName}
                />
            </div>
        </StudentLayout>
    );
};

// --- Test Detail Modal Component ---
const TestDetailModal = ({ test, onClose, t, language, fallbackSubjectName }) => {
    if (!test) return null;
    const testDate = test?.date ? new Date(test.date) : null;
    const hasDeclaredResult = test?.marksObtained !== null && test?.marksObtained !== undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isScheduled = !hasDeclaredResult && testDate && !Number.isNaN(testDate.getTime()) && testDate.getTime() > today.getTime();
    const isResultPending = !hasDeclaredResult && !isScheduled;
    const hasPassed = hasDeclaredResult && hasExamPassed(test);
    const subjectLabel = getExamSubjectLabel(test, fallbackSubjectName);
    const formattedDate = formatExamDate(test.date, language);
    const totalMarksLabel = formatMarksValue(test.totalMarks);
    const passingMarksLabel = formatMarksValue(resolvePassingMarks(test));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
<div
    // 👇 Yahan width badha di gayi hai (max-w-md sm:max-w-lg)
    className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 mx-4 sm:mx-auto"
    onClick={(e) => e.stopPropagation()}
>
    {/* Header */}
    <div className={`p-5 sm:p-6 flex items-start justify-between text-white ${
        isScheduled 
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700' 
            : isResultPending
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
            : hasPassed 
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700' 
                : 'bg-gradient-to-br from-rose-600 to-rose-800'
    }`}>
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
            <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-sm">
                {test.type || t('Test')} • {t('Assessment')}
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight leading-tight break-words">
                {test.name}
            </p>
        </div>
        <button
            onClick={onClose}
            className="h-9 w-9 shrink-0 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
        >
            <ChevronDown size={20} />
        </button>
    </div>

    {/* Content */}
    <div className="p-5 sm:p-7 space-y-6 sm:space-y-8">
        
        {/* Summary Metrics */}
        {isScheduled ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock size={64} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-blue-700">
                        <Clock size={18} className="animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-wider">{t('Scheduled Test')}</p>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-blue-900 leading-snug">
                        {t('Result not declared yet for this test.')}
                    </p>
                    <p className="mt-1.5 text-xs text-blue-600 font-medium">
                        {t('Scores and percentage will be visible after evaluation is completed.')}
                    </p>
                </div>
            </div>
        ) : isResultPending ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CheckCircle2 size={64} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-amber-700">
                        <CheckCircle2 size={18} />
                        <p className="text-xs font-black uppercase tracking-wider">{t('Completed')}</p>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-amber-900 leading-snug">
                        {t('Result not declared yet for this test.')}
                    </p>
                    <p className="mt-1.5 text-xs text-amber-700 font-medium">
                        {t('Scores and percentage will be visible after evaluation is completed.')}
                    </p>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('Score')}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">{test.marksObtained}</span>
                        <span className="text-sm font-bold text-slate-400">/ {test.totalMarks}</span>
                    </div>
                </div>
                <div className={`p-4 sm:p-5 rounded-xl border shadow-sm flex flex-col justify-center ${
                    hasPassed ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                        hasPassed ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                        {t('Percentage')}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className={`text-3xl font-black ${hasPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {test.percentage}%
                        </span>
                        {hasPassed ? <Award size={24} className="text-emerald-500" /> : <TrendingDown size={24} className="text-rose-500" />}
                    </div>
                </div>
            </div>
        )}

        {/* Highlighted Key Info Card (Date & Subject) */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="block text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">{t('Date')}</span>
                    <span className="text-sm sm:text-base font-bold text-indigo-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-indigo-500" />
                        {formattedDate}
                    </span>
                </div>
                <div>
                    <span className="block text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">{t('Subject')}</span>
                    <span className="text-sm sm:text-base font-bold text-indigo-900 truncate block" title={subjectLabel}>
                        {subjectLabel}
                    </span>
                </div>
            </div>
        </div>

        {/* Other Details List */}
        <div className="space-y-0 text-sm">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="font-medium text-slate-500">{t('Chapter')}</span>
                <span className="font-bold text-slate-900 text-right max-w-[60%] truncate" title={test.chapter}>{test.chapter}</span>
            </div>
            
            {isScheduled && (
                <>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="font-medium text-slate-500">{t('Total Marks')}</span>
                        <span className="font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">{totalMarksLabel}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="font-medium text-slate-500">{t('Passing Marks')}</span>
                        <span className="font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">{passingMarksLabel}</span>
                    </div>
                </>
            )}
            
            <div className="flex items-center justify-between py-3">
                <span className="font-medium text-slate-500">{t('Status')}</span>
                <span className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-full ${
                    isScheduled 
                        ? 'bg-blue-100 text-blue-700' 
                        : isResultPending
                            ? 'bg-amber-100 text-amber-700'
                        : hasPassed 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-rose-100 text-rose-700'
                }`}>
                    {isScheduled ? t('Upcoming') : isResultPending ? t('Result Pending') : hasPassed ? t('Passed') : t('Needs Work')}
                </span>
            </div>
        </div>
    </div>

    {/* Footer */}
    <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200">
        <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md"
        >
            {t('Close')}
        </button>
    </div>
</div>
        </div>
    );
};

// --- Calendar Helper Component (iOS Style) ---
const CalendarView = ({ records = [], t, language }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const recordMap = useMemo(() => {
        const map = {};
        records.forEach(r => {
            const date = new Date(r.attendanceDate).toISOString().split('T')[0];
            map[date] = r.status;
        });
        return map;
    }, [records]);

    const changeMonth = (offset) => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + offset);
        setViewDate(d);
    };

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Generate dates for the grid
    const prevMonthDays = new Date(year, month, 0).getDate();
    const calendarDates = [];

    // Padding from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarDates.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDates.push({ day: i, isCurrentMonth: true });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <span className="text-[13px] font-bold text-[#191838]">
                    {viewDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-4 text-slate-400">
                    <ChevronLeft size={18} className="cursor-pointer hover:text-[#191838]" onClick={() => changeMonth(-1)} />
                    <ChevronRight size={18} className="cursor-pointer hover:text-[#191838]" onClick={() => changeMonth(1)} />
                </div>
            </div>
            <div className="grid grid-cols-7 gap-y-3 text-center">
                {days.map((d, i) => <span key={i} className="text-[9px] font-black text-slate-200">{t(d)}</span>)}
                {calendarDates.map((item, i) => {
                    const { day, isCurrentMonth } = item;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const status = isCurrentMonth ? recordMap[dateStr] : null;
                    const isToday = isCurrentMonth && day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                    return (
                        <div key={i} className="flex flex-col items-center justify-center">
                            <div className={`
                                flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-bold transition-all
                                ${status === 'Present' ? 'bg-[#22c55e] text-white shadow-sm' : ''}
                                ${status === 'Absent' ? 'bg-rose-500 text-white shadow-sm' : ''}
                                ${status === 'Late' ? 'bg-amber-500 text-white shadow-sm' : ''}
                                ${isToday ? 'border-2 border-[#191838] text-[#191838]' : ''}
                                ${!isCurrentMonth ? 'text-slate-200 opacity-20' : status ? '' : 'text-slate-700'}
                            `}>
                                {day}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SubjectDetail;
