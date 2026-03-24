import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Award, TrendingDown, BookOpen, AlertTriangle,
    ChevronLeft, Clock, RefreshCcw, ChevronDown,
    Calendar, CheckCircle2, XCircle, Info, User,
    FileText, Hash, CheckCircle, ChevronRight, MapPin, MoreVertical, ArrowLeft,
    ClipboardList, Target, GraduationCap
} from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const SubjectDetail = () => {
    const { subjectName } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('Results'); 
    const [activeResultTab, setActiveResultTab] = useState('Assignments');
    const [selectedTest, setSelectedTest] = useState(null);
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

    const subjectData = useMemo(() => student?.subjectTeachers?.find(s => s.subject === subjectName), [student, subjectName]);
    const faculty = subjectData?.teacher || t('Unassigned');
    
    const attendanceInfo = useMemo(() => {
        return student?.attendanceSubjects?.find(s => s.subjectName === subjectName) || {
            percentage: 0,
            present: 0,
            absent: 0,
            late: 0,
            total: 0
        };
    }, [student, subjectName]);

    const attendanceProgress = attendanceInfo.percentage;

    const subjectId = useMemo(() => {
        if (!student) return null;
        return student.attendanceSubjects?.find(s => s.subjectName === subjectName)?.subjectId;
    }, [student, subjectName]);

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
        const typeMap = {
            'Assignments': 'Assignment',
            'Quizzes': 'Quiz',
            'Exams': 'Exam'
        };
        return subjectData.exams.filter(e => e.type === typeMap[activeResultTab]);
    }, [subjectData, activeResultTab]);

    if (studentLoading) return (
        <StudentLayout title={subjectName}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCcw className="animate-spin text-[#191838]" size={36} />
            </div>
        </StudentLayout>
    );

    const tabs = [
        { id: 'Results', label: t('Results'), icon: Award },
        { id: 'Syllabus', label: t('Syllabus'), icon: BookOpen },
        { id: 'Info', label: t('Info'), icon: Info }
    ];

    return (
        <StudentLayout title={subjectName} backUrl="/student/results">
            <div className="min-h-screen bg-[#fafbfc] pb-24 font-sans selection:bg-indigo-100">


            <main className="mx-auto max-w-md px-4 pt-4">
                {/* Attendance Summary Section - Always Visible at Top as requested */}
                <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[13px] font-black text-[#191838] uppercase tracking-wider flex items-center gap-2">
                                <GraduationCap size={16} className="text-indigo-500" />
                                {t('Attendance Overview')}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-[11px] font-black ${
                                attendanceProgress >= 75 ? 'bg-emerald-50 text-emerald-600' :
                                attendanceProgress >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                                {attendanceProgress}%
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Present')}</p>
                                <p className="text-sm font-bold text-emerald-600">{attendanceInfo.present}</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Absent')}</p>
                                <p className="text-sm font-bold text-rose-600">{attendanceInfo.absent + attendanceInfo.late}</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Total')}</p>
                                <p className="text-sm font-bold text-[#191838]">{attendanceInfo.total}</p>
                            </div>
                        </div>

                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    attendanceProgress >= 75 ? 'bg-emerald-500' :
                                    attendanceProgress >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${attendanceProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Custom Tab Bar (iOS Segmented Control Style) Moved Below Attendance */}
                <div className="sticky top-16 z-40 bg-[#fafbfc] py-3">
                    <div className="flex bg-slate-100 p-1 rounded-2xl shadow-sm">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-white text-[#191838] shadow-sm' 
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
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                            <ClipboardList size={40} />
                        </div>
                        <h4 className="text-xl font-bold text-[#191838]">{t('Syllabus Coming Soon')}</h4>
                        <p className="mt-3 text-sm font-medium text-slate-400 leading-relaxed max-w-[240px]">
                            {t('We are currently updating the chapter-wise syllabus for this subject. Please check back later.')}
                        </p>
                    </div>
                )}

                {/* 2. RESULTS TAB CONTENT */}
                {activeTab === 'Results' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        {/* Internal Sub-tabs for Result Types */}
                        <div className="flex gap-2 mb-6">
                            {['Assignments', 'Quizzes', 'Exams'].map(subTab => (
                                <button
                                    key={subTab}
                                    onClick={() => setActiveResultTab(subTab)}
                                    className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                        activeResultTab === subTab 
                                        ? 'bg-[#191838] text-white shadow-lg shadow-indigo-100' 
                                        : 'bg-white border border-slate-100 text-slate-400'
                                    }`}
                                >
                                    {t(subTab)}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {filteredResults.length > 0 ? (
                                filteredResults.map((e, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedTest(e)}
                                        className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${
                                                e.percentage >= 80 ? 'bg-emerald-50 text-emerald-600' : 
                                                e.percentage >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[#191838]">{e.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                                    {new Date(e.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {e.chapter}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-[#191838]">{e.marksObtained}/{e.totalMarks}</p>
                                            <p className={`text-[10px] font-bold uppercase ${
                                                e.percentage >= 80 ? 'text-emerald-500' : 'text-slate-400'
                                            }`}>{e.percentage}%</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed border-slate-100 bg-white/50 p-12 text-center shadow-sm">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                        <FileText size={28} />
                                    </div>
                                    <h4 className="text-lg font-bold text-[#191838]">{t(`No ${activeResultTab}`)}</h4>
                                    <p className="mt-2 text-sm font-medium text-slate-400 leading-relaxed max-w-[200px]">
                                        {t('Assessment records will appear here once published by faculty.')}
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
                        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2a2a5a] to-[#191838] p-6 text-white shadow-xl">
                            <div className="flex items-center gap-5">
                                <div className="h-20 w-20 overflow-hidden rounded-[24px] border-2 border-white/20 bg-white/10">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${faculty}`}
                                        alt="Faculty" 
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{t('Lead Faculty')}</p>
                                    <h3 className="text-xl font-bold">{faculty}</h3>
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 py-1 px-3 bg-white/10 rounded-full border border-white/5">
                                            <MapPin size={10} className="text-white/60" />
                                            <span className="text-[10px] font-bold">{subjectData?.rooms?.[0] || 'TBD'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 py-1 px-3 bg-white/10 rounded-full border border-white/5">
                                            <Clock size={10} className="text-white/60" />
                                            <span className="text-[10px] font-bold">{subjectData?.timings?.[0] || 'TBD'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule & Attendance Group */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm text-center">
                                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <Hash size={20} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Subject Code')}</p>
                                <p className="text-sm font-bold text-[#191838]">{subjectData?.code || '---'}</p>
                            </div>
                            <div className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm text-center">
                                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <GraduationCap size={20} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Attendance')}</p>
                                <p className="text-sm font-bold text-emerald-600">{attendanceProgress}%</p>
                            </div>
                        </div>

                        {/* Attendance Detail (Simplified Calendar) */}
                        <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
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
            />
        </div>
        </StudentLayout>
    );
};

// --- Test Detail Modal Component ---
const TestDetailModal = ({ test, onClose, t, language }) => {
    if (!test) return null;
    const hasPassed = (test.marksObtained / test.totalMarks) >= 0.4;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-8 flex items-center justify-between text-white ${hasPassed ? 'bg-gradient-to-br from-[#2a2a5a] to-[#191838]' : 'bg-gradient-to-br from-rose-600 to-rose-800'}`}>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{test.type || 'Test'} • {t('Assessment')}</span>
                        <h3 className="text-xl font-bold tracking-tight">{test.name}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <ChevronDown size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Summary Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-[32px] bg-slate-50 border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Score')}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#191838]">{test.marksObtained}</span>
                                <span className="text-sm font-bold text-slate-400">/ {test.totalMarks}</span>
                            </div>
                        </div>
                        <div className="p-5 rounded-[32px] bg-slate-50 border border-slate-100 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Percentage')}</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-black ${hasPassed ? 'text-indigo-600' : 'text-rose-600'}`}>{test.percentage}%</span>
                                {hasPassed ? <Award size={20} className="text-indigo-500" /> : <TrendingDown size={20} className="text-rose-500" />}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                            <span className="text-sm font-medium text-slate-500">{t('Chapter')}</span>
                            <span className="text-sm font-bold text-[#191838]">{test.chapter}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                            <span className="text-sm font-medium text-slate-500">{t('Date')}</span>
                            <span className="text-sm font-bold text-[#191838]">
                                {new Date(test.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-slate-500">{t('Status')}</span>
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${hasPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {hasPassed ? t('Passed') : t('Needs Work')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-[#191838] text-white text-xs font-black uppercase tracking-widest rounded-[24px] hover:bg-[#2a2a5a] transition-all active:scale-95 shadow-xl shadow-indigo-100"
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