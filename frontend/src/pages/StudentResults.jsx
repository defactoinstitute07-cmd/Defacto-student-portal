import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import api, { clearAuthSession } from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Award, TrendingUp, TrendingDown, BookOpen,
    AlertTriangle, Filter, Search, Award as Trophy,
    Clock, RefreshCcw, ChevronDown
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TestDetailModal = ({ test, onClose }) => {
    const { t, language } = useLanguage();
    if (!test) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
<div
    className="bg-white rounded-2xl sm:rounded-[24px] w-full max-w-md sm:max-w-lg mx-4 sm:mx-auto overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
    onClick={(e) => e.stopPropagation()}
>
    {/* Header */}
    <div className={`p-5 sm:p-7 flex items-start justify-between text-white ${
        test.hasPassed 
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
            : 'bg-gradient-to-br from-rose-500 to-rose-700'
    }`}>
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
            <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-sm">
                {test.subject} • {t('Assessment')}
            </span>
            <p className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight break-words">
                {test.examName}
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
    <div className="p-5 sm:p-7 space-y-6 sm:space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('Score Obtained')}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{test.marksObtained}</span>
                    <span className="text-sm font-bold text-slate-400">/ {test.totalMarks}</span>
                </div>
            </div>
            <div className={`p-4 sm:p-5 rounded-xl border shadow-sm flex flex-col justify-center ${
                test.hasPassed ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
            }`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                    test.hasPassed ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                    {t('Percentage')}
                </p>
                <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black ${test.hasPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {test.percentage}%
                    </span>
                    {test.hasPassed ? <Award size={24} className="text-emerald-500" /> : <TrendingDown size={24} className="text-rose-500" />}
                </div>
            </div>
        </div>

        {/* Details Table */}
        <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">
                {t('Detailed Assessment')}
            </h4>
            <div className="bg-white rounded-xl border border-slate-100 p-1">
                <div className="flex items-center justify-between py-3 px-3 border-b border-slate-50">
                    <span className="text-sm font-medium text-slate-500">{t('Chapter')}</span>
                    <span className="text-sm font-bold text-slate-900 text-right max-w-[60%] truncate" title={test.chapter}>{test.chapter}</span>
                </div>
                <div className="flex items-center justify-between py-3 px-3 border-b border-slate-50">
                    <span className="text-sm font-medium text-slate-500">{t('Test Date')}</span>
                    <span className="text-sm font-bold text-slate-900">
                        {new Date(test.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
                <div className="flex items-center justify-between py-3 px-3">
                    <span className="text-sm font-medium text-slate-500">{t('Status')}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                        test.hasPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                        {test.hasPassed ? t('Pass / Excellent') : t('Needs Re-revision')}
                    </span>
                </div>
            </div>
        </div>

        {/* Teacher Remarks */}
        <div className="bg-indigo-50/60 p-5 sm:p-6 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-600 mb-2.5">
                <Award size={18} />
                <h4 className="text-[11px] font-bold uppercase tracking-widest">{t("Teacher's Remarks")}</h4>
            </div>
            <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
                {test.remarks || t('No specific feedback provided for this assessment.')}
            </p>
        </div>
        
    </div>

    {/* Footer Action */}
    <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex justify-end">
        <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md hover:shadow-lg"
        >
            {t('Close Details')}
        </button>
    </div>
</div>
        </div>

    );
};

const StudentResults = () => {
    const RESULTS_PER_PAGE = 5;
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [error, setError] = useState('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Passed', 'Needs Work'
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTest, setSelectedTest] = useState(null);
    const token = localStorage.getItem('studentToken');

    useEffect(() => {
        if (!token) {
            navigate('/student/login');
        }
    }, [navigate, token]);

    const fetchResultsPage = async ({ pageParam }) => {
        try {
            const params = { limit: 25 };
            if (pageParam) params.cursor = pageParam;
            const resResponse = await api.get('/student/results', { params });
            if (resResponse.data.success) {
                if (!pageParam) await setCached('student.results', resResponse.data);
                return resResponse.data;
            }
            throw new Error('Failed to load results');
        } catch (err) {
            if (err.response?.status === 401) {
                clearAuthSession();
                navigate('/student/login');
                throw err;
            }
            if (!pageParam) {
                const cached = await getCached('student.results');
                if (cached) return cached;
            }
            throw err;
        }
    };

    const {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ['student', 'results'],
        enabled: !!token,
        queryFn: fetchResultsPage,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
        onError: () => setError(t('Failed to load results data. Please try again later.'))
    });

    const results = useMemo(() => (data?.pages || []).flatMap(page => page.results || []), [data]);
    const stats = data?.pages?.[0]?.stats || null;
    const weakSubjects = data?.pages?.[0]?.weakSubjects || [];
    const studentInfo = data?.pages?.[0]?.studentInfo || null;


    // Derived Data: Distinct subjects for filter
    const subjects = useMemo(() => {
        const subs = new Set(results.map(r => r.subject));
        return ['All', ...Array.from(subs)];
    }, [results]);

    // Filtered and Sorted Results
    const filteredResults = useMemo(() => {
        let filtered = results.filter(r => {
            const matchesSearch =
                r.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.chapter.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSubject = subjectFilter === 'All' || r.subject === subjectFilter;

            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Passed' && r.hasPassed) ||
                (statusFilter === 'Needs Work' && !r.hasPassed);

            return matchesSearch && matchesSubject && matchesStatus;
        });

        // Apply Sorting
        return filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [results, searchTerm, subjectFilter, statusFilter, sortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PER_PAGE));

    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * RESULTS_PER_PAGE;
        return filteredResults.slice(start, start + RESULTS_PER_PAGE);
    }, [filteredResults, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, subjectFilter, statusFilter, sortOrder, results.length]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Group tests by subject for drill-down analysis
    const subjectWiseHistory = useMemo(() => {
        const grouped = {};
        results.forEach(res => {
            if (!grouped[res.subject]) grouped[res.subject] = [];
            grouped[res.subject].push(res);
        });
        return grouped;
    }, [results]);

    // Graph Data
    const chartData = useMemo(() => {
        const sortedResults = [...results].sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            labels: sortedResults.map(r => new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ` (${r.subject})`),
            datasets: [
                {
                    label: t('Percentage'),
                    data: sortedResults.map(r => parseFloat(r.percentage)),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: sortedResults.map(r => parseFloat(r.percentage) >= 60 ? '#10b981' : '#f43f5e'),
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }
            ]
        };
    }, [results]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${t('Score Obtained')}: ${context.parsed.y}%`
                }
            }
        },
        scales: {
            y: { min: 0, max: 100, ticks: { callback: value => value + '%' } },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-0 sm:px-0 pb-8 sm:pb-12">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-md p-4 sm:p-6 flex items-center gap-3 sm:gap-4 border border-gray-100">
                            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-md" />
                            <div className="flex-1">
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        <Skeleton className="h-64 w-full rounded-md" />
                        <div className="bg-white rounded-md border border-gray-100 p-4 sm:p-6 space-y-4">
                            <Skeleton className="h-6 w-48" />
                            <div className="space-y-2">
                                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 px-0 sm:px-0 pb-8 sm:pb-12">
            {/* Header Section */}
            <div className="relative overflow-hidden   rounded-[10px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 sm:p-6 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
                <div className="absolute -top-10 -right-10 h-36 w-36   rounded-[10px] bg-indigo-100/50" />
                <div className="relative flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{t('Academic Analytics')}</h1>
                    {studentInfo?.batchName && (
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase   rounded-[10px] border border-indigo-100">{studentInfo.batchName}</span>
                    )}
                </div>
                <p className="relative text-gray-600 text-sm sm:text-base max-w-2xl">{t('View your test scores, track progress, and identify areas for improvement.')}</p>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-700 p-3 sm:p-4   rounded-[10px] border border-rose-200 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white   rounded-[10px] shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <BookOpen size={20} className="sm:hidden" />
                        <BookOpen size={24} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('Tests Attempted')}</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats?.totalTests || 0}</h3>
                    </div>
                </div>

                <div className="bg-white   rounded-[10px] shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Award size={20} className="sm:hidden" />
                        <Award size={24} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('Average Score')}</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-emerald-700">{stats?.overallPercentage || 0}%</h3>
                    </div>
                </div>

                <div className="bg-white   rounded-[10px] shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center gap-3 sm:gap-4 sm:col-span-2 lg:col-span-1">
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 ${weakSubjects.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {weakSubjects.length > 0 ? (
                            <>
                                <TrendingDown size={20} className="sm:hidden" />
                                <TrendingDown size={24} className="hidden sm:block" />
                            </>
                        ) : (
                            <>
                                <TrendingUp size={20} className="sm:hidden" />
                                <TrendingUp size={24} className="hidden sm:block" />
                            </>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('Warning Status')}</p>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                            {weakSubjects.length > 0 ? `${weakSubjects.length} ${t('Weak Subjects')}` : t('On Track')}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Performance Analytics & Progress */}
            <div className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">

                    {/* Progressive Chart Box */}
                    <div className="bg-white   rounded-[10px] shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                            <TrendingUp className="text-blue-500 shrink-0" size={18} />
                            <span>{t('Progress Over Time')}</span>
                        </h3>
                        {results.length > 1 ? (
                            <div className="h-48 sm:h-64 w-full">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        ) : (
                            <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg p-4">
                                <BookOpen size={28} className="mb-2 opacity-50" />
                                <p className="text-sm text-center">{t('More test data needed to chart progress.')}</p>
                            </div>
                        )}
                    </div>

                    {/* Weak Subjects Alert Box - Interactive */}
                    {weakSubjects.length > 0 && (
                        <div className="bg-white   rounded-[10px] shadow-sm border border-orange-200 overflow-hidden">

                            <div className="p-4 sm:p-6 bg-orange-50/50 border-b border-orange-100">
                                <h3 className="text-sm sm:text-lg font-bold text-orange-800 mb-1 flex items-center gap-2">
                                    <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
                                    <span>{t('Priority Subject Focus')}</span>
                                </h3>

                                <p className="text-orange-700 text-[10px] sm:text-xs">
                                    {t("Click on a subject to review weak chapters and teacher's feedback.")}
                                </p>
                            </div>

                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

                                {/* Horizontal Tab List */}
                                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">

                                    {weakSubjects.map((ws, idx) => (
                                        <button
                                            key={ws.subject}
                                            onClick={() => navigate(`/student/results/subject/${ws.subject}`)}

                                            className="flex-shrink-0 px-4 sm:px-5 py-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-start gap-1 min-w-[120px] sm:min-w-[140px] bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-blue-50 active:scale-[0.96] group"
                                        >

                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">
                                                {ws.subject}
                                            </span>

                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <span className="text-base sm:text-lg font-black text-gray-800">
                                                    {ws.percentage}%
                                                </span>

                                                <TrendingDown size={12} className="sm:w-[14px] sm:h-[14px] text-orange-500" />
                                            </div>



                                        </button>
                                    ))}

                                </div>
                            </div>
                        </div>
                    )}

                  {/* Results Table Section */}
<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">

    {/* Header & Filters */}
    <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
        
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-5">
            {t('Complete Test History')}
        </h3>

        <div className="flex flex-col gap-3 sm:gap-4">
            
            {/* Top Row: Search & Subject */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t('Search by test name or chapter...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                </div>

                {/* Subject Filter */}
                <div className="relative w-full sm:w-[220px] shrink-0">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                        {subjects.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Bottom Row: Status & Sort (Grid on mobile for better fit) */}
            <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4">
                {/* Status Filter */}
                <div className="relative w-full sm:w-[200px]">
                    <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                        <option value="All">{t('All Statuses')}</option>
                        <option value="Passed">{t('Passed')}</option>
                        <option value="Needs Work">{t('Needs Work')}</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>

                {/* Sort Filter */}
                <div className="relative w-full sm:w-[200px]">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                        <option value="desc">{t('Newest First')}</option>
                        <option value="asc">{t('Oldest First')}</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>
    </div>


    {/* Mobile Card View (Appears only on small screens) */}
    <div className="block sm:hidden bg-slate-50/50">
        {filteredResults.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-500 text-sm font-medium">
                {t('No results match your criteria.')}
            </div>
        ) : (
            <div className="p-3 space-y-3">
                {paginatedResults.map((r, idx) => (
                    <div
                        key={r._id || r.id || idx}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer transition-all active:scale-[0.98] hover:border-indigo-200 hover:shadow-md"
                        onClick={() => setSelectedTest(r)}
                    >
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-900 text-sm truncate pr-2">
                                    {r.examName}
                                </h4>
                                <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                                    {r.subject} • {r.chapter}
                                </p>
                            </div>
                            <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                r.hasPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                                {r.hasPassed ? t('Passed') : t('Needs Work')}
                            </span>
                        </div>

                        <div className="flex items-end justify-between mt-4">
                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                <Clock size={12} />
                                <span className="text-[11px] font-semibold">
                                    {new Date(r.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="text-right">
                                <span className="text-lg font-black text-slate-900 leading-none">
                                    {r.marksObtained}
                                </span>
                                <span className="text-xs font-bold text-slate-400">
                                    /{r.totalMarks}
                                </span>
                                <span className={`text-xs font-bold ml-1.5 ${r.hasPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ({r.percentage}%)
                                </span>
                            </div>
                        </div>

                        {r.remarks && (
                            <div className="mt-3 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50">
                                <p className="text-[11px] text-slate-600 flex gap-1.5 items-start leading-snug">
                                    <span className="font-bold text-indigo-700 shrink-0 uppercase tracking-wide text-[9px] mt-0.5">
                                        {t('Remark')}
                                    </span>
                                    <span className="italic font-medium">{r.remarks}</span>
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>


    {/* Desktop Table View (Appears on sm and larger) */}
    <div className="hidden sm:block overflow-x-auto">
        {filteredResults.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500 font-medium">
                {t('No results match your criteria.')}
            </div>
        ) : (
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-y border-slate-200">
                    <tr>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-500">{t('Exam Details')}</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-500">{t('Subject')}</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-500">{t('Date')}</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-500">{t('Score')}</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-500">{t('Status')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {paginatedResults.map((r, idx) => (
                        <tr
                            key={r._id || r.id || idx}
                            className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                            onClick={() => setSelectedTest(r)}
                        >
                            <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{r.examName}</p>
                                <p className="text-xs font-medium text-slate-500 truncate max-w-[280px] mt-0.5">{r.chapter}</p>
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-slate-700">{r.subject}</td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-600">
                                {new Date(r.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                })}
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-sm font-black text-slate-900">{r.marksObtained}</span>
                                <span className="text-xs font-bold text-slate-400">/{r.totalMarks}</span>
                                <span className={`text-xs font-bold ml-1.5 ${r.hasPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ({r.percentage}%)
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                    r.hasPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                    {r.hasPassed ? t('Passed') : t('Needs Work')}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>

    {/* Local Pagination Controls */}
    {filteredResults.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
            <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
                {t('Previous')}
            </button>

            <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                {t('Page')} {currentPage} {t('of')} {totalPages}
            </span>

            <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
                {t('Next')}
            </button>
        </div>
    )}

    {/* Load More Button (If handling API pagination) */}
    {hasNextPage && (
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-white flex justify-center">
            <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md hover:shadow-lg"
            >
                {isFetchingNextPage ? (
                    <span className="flex items-center gap-2">
                        <Clock size={14} className="animate-spin" /> {t('Loading more...')}
                    </span>
                ) : (
                    t('Load more results')
                )}
            </button>
        </div>
    )}

</div>





                </div>


            </div>

            {/* Render Modal */}
            <TestDetailModal
                test={selectedTest}
                onClose={() => setSelectedTest(null)}
            />
        </div>
    );
};

export default StudentResults; 
