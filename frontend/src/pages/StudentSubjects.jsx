import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, BookOpen, User } from 'lucide-react';

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

const normalizeSubjectId = (subject) => normalizeId(
    subject?.subjectId
    || subject?._id
    || subject?.id
    || subject?.subject?._id
    || subject?.subject?.id
);

const getLinkedBatchIds = (subject, fallbackBatchId = null) => {
    const linked = new Set();

    const addIfValid = (candidate) => {
        const id = normalizeId(candidate);
        if (id) linked.add(id);
    };

    if (Array.isArray(subject?.batchIds)) {
        subject.batchIds.forEach(addIfValid);
    }

    addIfValid(subject?.batchId);
    addIfValid(subject?.subject?.batchId);

    if (Array.isArray(subject?.subject?.batchIds)) {
        subject.subject.batchIds.forEach(addIfValid);
    }

    // Preserve legacy behavior when backend payload does not include explicit subject batch links.
    if (linked.size === 0 && fallbackBatchId) {
        addIfValid(fallbackBatchId);
    }

    return Array.from(linked);
};

const subjectMatchesStudentBatch = (subject, studentBatchId) => {
    const targetBatchId = normalizeId(studentBatchId);
    if (!targetBatchId) return true;

    const linkedBatchIds = Array.isArray(subject?.linkedBatchIds) ? subject.linkedBatchIds : [];
    if (linkedBatchIds.includes(targetBatchId)) return true;

    const legacyBatchId = normalizeId(subject?.batchId || subject?.subject?.batchId);
    return legacyBatchId === targetBatchId;
};

const StudentSubjects = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const token = localStorage.getItem('studentToken');
    const loginSeedStudent = useMemo(() => {
        try {
            const raw = localStorage.getItem('studentInfo');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }, []);
    const batchHintFromStorage = useMemo(() => {
        try {
            const raw = localStorage.getItem('studentInfo');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return normalizeId(parsed?.activeBatchId || parsed?.batchId || parsed?.fullBatchData?._id);
        } catch {
            return null;
        }
    }, []);

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
                const params = {};
                if (batchHintFromStorage) params.batchId = batchHintFromStorage;
                const res = await api.get('/student/me', { params });
                if (res.data.success) {
                    const profileStudent = res.data.student || {};
                    if (import.meta.env.DEV) {
                        console.log('[SUBJECT_DEBUG] /student/me response', {
                            activeBatchId: profileStudent?.activeBatchId,
                            batchName: profileStudent?.batchName,
                            subjectsCount: Array.isArray(profileStudent?.subjects) ? profileStudent.subjects.length : 0,
                            subjectTeachersCount: Array.isArray(profileStudent?.subjectTeachers) ? profileStudent.subjectTeachers.length : 0,
                            batchSubjectsCount: Array.isArray(profileStudent?.fullBatchData?.subjects) ? profileStudent.fullBatchData.subjects.length : 0
                        });
                    }
                    const seedSubjects = Array.isArray(loginSeedStudent?.subjects) ? loginSeedStudent.subjects : [];
                    const profileSubjects = Array.isArray(profileStudent?.subjects) ? profileStudent.subjects : [];
                    const mergedProfileStudent = {
                        ...profileStudent,
                        activeBatchId: profileStudent?.activeBatchId || loginSeedStudent?.activeBatchId || null,
                        batchName: profileStudent?.batchName || loginSeedStudent?.batch || loginSeedStudent?.fullBatchData?.name || '',
                        subjects: profileSubjects.length > 0 ? profileSubjects : seedSubjects,
                        fullBatchData: {
                            ...(loginSeedStudent?.fullBatchData || {}),
                            ...(profileStudent?.fullBatchData || {})
                        }
                    };

                    const hasUsableSubjects = (
                        Array.isArray(mergedProfileStudent?.subjects) && mergedProfileStudent.subjects.length > 0
                    ) || (
                        Array.isArray(mergedProfileStudent?.subjectTeachers) && mergedProfileStudent.subjectTeachers.length > 0
                    ) || (
                        Array.isArray(mergedProfileStudent?.fullBatchData?.subjects) && mergedProfileStudent.fullBatchData.subjects.length > 0
                    );

                    if (hasUsableSubjects) {
                        await setCached('student.me', mergedProfileStudent);
                        return mergedProfileStudent;
                    }

                    try {
                        const subjectsRes = await api.get('/student/subjects', { params });
                        const fallbackSubjects = Array.isArray(subjectsRes?.data?.subjects) ? subjectsRes.data.subjects : [];
                        if (import.meta.env.DEV) {
                            console.log('[SUBJECT_DEBUG] /student/subjects response', {
                                activeBatchId: subjectsRes?.data?.activeBatchId,
                                batchName: subjectsRes?.data?.batchName,
                                subjectsCount: fallbackSubjects.length,
                                subjects: fallbackSubjects.map((item) => item?.subject || item?.name).filter(Boolean)
                            });
                        }

                        const mergedStudent = {
                            ...mergedProfileStudent,
                            activeBatchId: mergedProfileStudent?.activeBatchId || subjectsRes?.data?.activeBatchId || null,
                            batchName: mergedProfileStudent?.batchName || subjectsRes?.data?.batchName || mergedProfileStudent?.fullBatchData?.name || '',
                            subjects: fallbackSubjects,
                            fullBatchData: {
                                ...(mergedProfileStudent?.fullBatchData || {}),
                                subjects: fallbackSubjects.map((item) => String(item?.subject || item?.name || '').trim()).filter(Boolean)
                            }
                        };

                        await setCached('student.me', mergedStudent);
                        return mergedStudent;
                    } catch {
                        await setCached('student.me', mergedProfileStudent);
                        return mergedProfileStudent;
                    }
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
        onError: (err) => {
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                setError(t('You are not authorized to view subjects for this account.'));
                return;
            }

            setError(t('Failed to load subjects. Please try again in a moment.'));
        }
    });

    const studentBatchId = useMemo(() => (
        normalizeId(student?.activeBatchId)
        || normalizeId(student?.batchId)
        || normalizeId(student?.fullBatchData?._id)
    ), [student]);

    const studentBatchName = useMemo(() => (
        String(student?.batchName || student?.fullBatchData?.name || '').trim() || t('N/A')
    ), [student?.batchName, student?.fullBatchData?.name, t]);

    const subjects = useMemo(() => {
        const subjectTeachers = Array.isArray(student?.subjectTeachers) ? student.subjectTeachers : [];
        const resolvedSubjects = Array.isArray(student?.subjects) ? student.subjects : [];
        const batchSubjectsFallback = Array.isArray(student?.fullBatchData?.subjects)
            ? student.fullBatchData.subjects.map((name) => ({ subject: name }))
            : [];

        const teacherLookup = new Map();
        subjectTeachers.forEach((entry) => {
            const nameKey = String(entry?.subject || '').trim().toLowerCase();
            const codeKey = String(entry?.code || '').trim().toLowerCase();
            if (nameKey) teacherLookup.set(`name:${nameKey}`, entry);
            if (codeKey) teacherLookup.set(`code:${codeKey}`, entry);
        });

        const preferredRaw = resolvedSubjects.length > 0
            ? resolvedSubjects
            : (subjectTeachers.length > 0 ? subjectTeachers : batchSubjectsFallback);

        const harmonizedSubjects = preferredRaw.map((entry) => {
            const base = typeof entry === 'string' ? { subject: entry, name: entry } : (entry || {});
            const subjectName = String(base.subject || base.name || '').trim();
            const subjectCode = String(base.code || '').trim();
            const matchedTeacherEntry = teacherLookup.get(`name:${subjectName.toLowerCase()}`)
                || teacherLookup.get(`code:${subjectCode.toLowerCase()}`)
                || null;

            const chapters = Array.isArray(base.chapters) ? base.chapters : [];
            const chapterCompletedCount = chapters.filter((chapter) => chapter?.status === 'completed' || chapter?.isCompleted === true).length;
            const totalChapters = Number.isFinite(Number(base.totalChapters))
                ? Number(base.totalChapters)
                : chapters.length;
            const derivedSyllabus = totalChapters > 0 || chapters.length > 0
                ? {
                    chapters: chapters.map((chapter) => ({
                        ...chapter,
                        isCompleted: chapter?.isCompleted === true || chapter?.status === 'completed'
                    })),
                    totalChapters,
                    completedChapters: chapterCompletedCount,
                    completionPercentage: totalChapters > 0 ? Math.round((chapterCompletedCount / totalChapters) * 100) : 0
                }
                : null;

            return {
                ...base,
                ...(matchedTeacherEntry || {}),
                subject: subjectName || matchedTeacherEntry?.subject || '',
                code: subjectCode || matchedTeacherEntry?.code || null,
                subjectId: normalizeId(base._id || base.subjectId || matchedTeacherEntry?._id || matchedTeacherEntry?.subjectId),
                batchId: base.batchId || matchedTeacherEntry?.batchId || null,
                batchIds: Array.isArray(base.batchIds) ? base.batchIds : (matchedTeacherEntry?.batchIds || []),
                batchNames: Array.isArray(base.batchNames) ? base.batchNames : (matchedTeacherEntry?.batchNames || []),
                syllabus: matchedTeacherEntry?.syllabus || derivedSyllabus || base.syllabus || {},
                exams: matchedTeacherEntry?.exams || base.exams || [],
                teacher: matchedTeacherEntry?.teacher || base.teacher || 'Unassigned',
                teacherProfileImage: matchedTeacherEntry?.teacherProfileImage || base.teacherProfileImage || null,
                averageMarks: Number.isFinite(Number(matchedTeacherEntry?.averageMarks))
                    ? Number(matchedTeacherEntry.averageMarks)
                    : (Number.isFinite(Number(base.averageMarks)) ? Number(base.averageMarks) : 0)
            };
        });

        const normalizedSubjects = harmonizedSubjects.map((entry, index) => {
            const subjectId = normalizeSubjectId(entry);
            const linkedBatchIds = getLinkedBatchIds(entry, studentBatchId);

            return {
                ...entry,
                subjectId,
                linkedBatchIds,
                legacyBatchId: normalizeId(entry?.batchId || entry?.subject?.batchId),
                __dedupeKey: subjectId
                    || `${String(entry?.subject || '').trim().toLowerCase()}::${String(entry?.code || '').trim().toLowerCase()}::${index}`
            };
        });

        const visible = normalizedSubjects.filter((entry) => subjectMatchesStudentBatch(entry, studentBatchId));
        const deduped = new Map();

        visible.forEach((entry) => {
            const byIdKey = entry.subjectId ? `id:${entry.subjectId}` : null;
            const byNameKey = `name:${String(entry.subject || '').trim().toLowerCase()}::${String(entry.code || '').trim().toLowerCase()}`;

            const existing = (byIdKey && deduped.get(byIdKey)) || deduped.get(byNameKey);
            if (!existing) {
                if (byIdKey) deduped.set(byIdKey, entry);
                deduped.set(byNameKey, entry);
                return;
            }

            const existingScore = Number.isFinite(Number(existing.averageMarks)) ? Number(existing.averageMarks) : -1;
            const candidateScore = Number.isFinite(Number(entry.averageMarks)) ? Number(entry.averageMarks) : -1;
            if (candidateScore > existingScore) {
                if (byIdKey) deduped.set(byIdKey, entry);
                deduped.set(byNameKey, entry);
            }
        });

        return Array.from(deduped.values()).filter((value, idx, arr) => arr.findIndex((v) => v.__dedupeKey === value.__dedupeKey) === idx);
    }, [student?.subjectTeachers, student?.subjects, student?.fullBatchData?.subjects, studentBatchId, loginSeedStudent?.subjects]);

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

    const getTeacherAvatar = (subjectTeacher, subjectName) => {
        const fallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(subjectTeacher || subjectName || 'teacher')}`;
        const raw = String(subjectTeacher?.teacherProfileImage || '').trim();
        if (!raw) return fallback;
        if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
        if (raw.startsWith('/')) return raw;
        return `/${raw}`;
    };

    const isSyllabusCompleted = (subjectEntry) => {
        const syllabus = subjectEntry?.syllabus || {};
        const completion = Number(syllabus.completionPercentage);
        if (Number.isFinite(completion) && completion >= 100) {
            return true;
        }

        const total = Number(syllabus.totalChapters);
        const completed = Number(syllabus.completedChapters);
        if (Number.isFinite(total) && total > 0 && Number.isFinite(completed) && completed >= total) {
            return true;
        }

        const chapters = Array.isArray(syllabus.chapters) ? syllabus.chapters : [];
        if (chapters.length > 0 && chapters.every((chapter) => chapter?.isCompleted === true)) {
            return true;
        }

        return false;
    };

    if (isLoading) {
        return (
            <div className="bg-slate-50 px-5 pt-6 pb-24 no-scrollbar scroll-smooth min-h-screen">
                <Skeleton className="h-32 w-full rounded-[15px] mb-6" />
                <div className="flex gap-6 border-b border-slate-100 mb-6">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-10 w-24 mb-3" />
                    ))}
                </div>
                <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-24 rounded-[15px]" />
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
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
            <main className="p0">
                <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
                    <div className="absolute -right-14 -top-14 h-40 w-40 rounded-[15px] bg-blue-100/60" />
                    <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-[15px] bg-emerald-100/40" />

                    <div className="relative">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{t('Subject Overview')}</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#191838] sm:text-3xl">{t('Your Academic Load')}</h2>
                        <p className="mt-2 max-w-xl text-sm text-slate-600">
                            {t('Open any subject to view chapter-wise progress, marks, and teacher feedback.')}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            
                            <span className="inline-flex items-center rounded-[15px] bg-indigo-50 px-3 py-1.5 text-[11px] font-bold tracking-wide text-indigo-700 border border-indigo-100">
                                {subjects.length} {t('Subjects')}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-[15px] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('Total')}</p>
                        <p className="mt-2 text-xl font-black text-slate-900">{subjects.length}</p>
                    </div>
                    <div className="rounded-[15px] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('On Track')}</p>
                        <p className="mt-2 text-xl font-black text-emerald-700">{onTrackCount}</p>
                    </div>
                    <div className="rounded-[15px] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('Average')}</p>
                        <p className="mt-2 text-xl font-black text-[#191838]">{overallAverage}%</p>
                    </div>
                </section>

                {/* Tabs */}
                <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
                    {['All', 'Ongoing', 'Completed'].map((tab) => {
                        const count = tab === 'Completed'
                            ? subjects.filter((s) => isSyllabusCompleted(s)).length
                            : tab === 'Ongoing'
                                ? subjects.filter((s) => !isSyllabusCompleted(s)).length
                                : subjects.length;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-[15px] text-[12px] font-black uppercase tracking-wider transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
                                    activeTab === tab
                                        ? 'bg-[#191838] text-white border-[#191838]'
                                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {tab === 'Completed' && <CheckCircle2 size={13} />}
                                {t(tab)}
                                <span className={`ml-0.5 text-[10px] rounded-[15px] px-1.5 py-0.5 font-black ${
                                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div className="mt-5 rounded-[15px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-4 mt-5">
                    {(() => {
                        if (!error && subjects.length === 0) {
                            return (
                                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
                                    <div className="flex justify-center mb-3">
                                        <BookOpen size={32} className="text-slate-300" />
                                    </div>
                                    <p className="font-semibold text-slate-600">
                                        {t('No subjects available for your class level/batch.')}
                                    </p>
                                </div>
                            );
                        }

                        const filteredSubjects = activeTab === 'Completed'
                            ? subjects.filter((s) => isSyllabusCompleted(s))
                            : activeTab === 'Ongoing'
                                ? subjects.filter((s) => !isSyllabusCompleted(s))
                                : subjects;

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
                            const teacherAvatar = getTeacherAvatar(s, s.subject);

                            // Syllabus progress
                            const syllabusData = s.syllabus || {};
                            const totalCh = syllabusData.totalChapters || syllabusData.chapters?.length || 0;
                            const completedCh = syllabusData.completedChapters || syllabusData.chapters?.filter(c => c.isCompleted).length || 0;
                            const syllPct = syllabusData.completionPercentage ?? (totalCh > 0 ? Math.round((completedCh / totalCh) * 100) : 0);
                            const isFullyCompleted = isSyllabusCompleted(s);
                            const assignedBatchLabel = Array.isArray(s.batchNames) && s.batchNames.length > 0
                                ? s.batchNames.join(', ')
                                : studentBatchName;

                            return (
                                <button
                                    key={s.subjectId || `${s.subject}-${s.code || idx}`}
                                    onClick={() => {
                                        const encodedSubjectName = encodeURIComponent(String(s.subject || ''));
                                        const query = new URLSearchParams();
                                        if (s.subjectId) query.set('subjectId', s.subjectId);
                                        if (studentBatchId) query.set('batchId', studentBatchId);

                                        const qs = query.toString();
                                        navigate(`/student/results/subject/${encodedSubjectName}${qs ? `?${qs}` : ''}`);
                                    }}
                                    className={`group relative w-full overflow-hidden rounded-[15px] bg-white p-5 text-left transition-all duration-300 active:scale-[0.98] hover:-translate-y-0.5 ${
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
                                        <div className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[15px] text-[22px] font-bold tracking-tighter border transition-colors ${
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
                                                        <span className="rounded-[15px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
                                                            {t('Syllabus Done')}
                                                        </span>
                                                    ) : (
                                                        <span className={`rounded-[15px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${theme.badgeBg} ${theme.badgeText} ${theme.showBorder ? 'border-red-200' : 'border-transparent'}`}>
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

                                            <p className="mt-1 text-[12px] text-slate-500">
                                                <span className="font-semibold text-slate-400">{t('Batch')}: </span>
                                                <span className="font-semibold text-slate-700">{assignedBatchLabel}</span>
                                            </p>

                                            <div className="mt-3 flex items-center gap-3 rounded-[15px] border border-slate-200 bg-slate-50 px-3 py-2">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-white bg-white">
                                                    {teacherName === t('Unassigned') ? (
                                                        <User size={18} className="text-slate-400" />
                                                    ) : (
                                                        <img
                                                            src={teacherAvatar}
                                                            alt={teacherName}
                                                            className="h-full w-full object-cover"
                                                            onError={(event) => {
                                                                event.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.teacher || s.subject || 'teacher')}`;
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t('Assigned Teacher')}</p>
                                                    <p className="truncate text-sm font-bold text-[#191838]">{teacherName}</p>
                                                </div>
                                            </div>

                             

                                            <div className="mt-3 flex items-center justify-between text-[11px] font-bold tracking-wide">
                                                <span className="text-slate-500">{t('Overall Progress')}</span>
                                                <span className={averageMarks >= 75 ? 'text-emerald-700' : 'text-[#191838]'}>{averageMarks}%</span>
                                            </div>

                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-[15px] bg-slate-100">
                                                <div 
                                                    className={`h-full rounded-[15px] transition-all duration-500 ${theme.barColor}`}
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