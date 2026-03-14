import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    ArrowLeft, Calendar, Clock, CheckCircle2,
    XCircle, AlertCircle, Loader2, BookOpen, ChevronRight
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useQuery } from '@tanstack/react-query';

const SubjectAttendanceDetail = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [subjectInfo, setSubjectInfo] = useState(null);

    const [selectedWeek, setSelectedWeek] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay()); // Start of current week (Sunday)
        return d.toISOString().split('T')[0];
    });
    const [filterMode, setFilterMode] = useState('last5'); // 'last5' or 'week'

    const token = localStorage.getItem('studentToken');

    useEffect(() => {
        if (!token) {
            navigate('/student/login');
            return;
        }

        const fetchDetails = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch student profile to get subject name/code (cached usually)
                const profileRes = await api.get('/student/me');
                if (profileRes.data.success) {
                    const sub = profileRes.data.student.attendanceSubjects?.find(s => s.subjectId === subjectId);
                    setSubjectInfo(sub);
                }

                // Fetch detailed records
                const res = await api.get(`/student/attendance/subject/${subjectId}`);
                if (res.data.success) {
                    setRecords(res.data.records);
                }
            } catch (err) {
                setError('Failed to load attendance details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [subjectId, token, navigate]);

    // --- Filtering Logic ---
    const getFilteredRecords = () => {
        if (filterMode === 'last5') {
            return [...records].sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate)).slice(0, 5);
        }
        
        const start = new Date(selectedWeek);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        return records.filter(r => {
            const d = new Date(r.attendanceDate);
            return d >= start && d < end;
        });
    };

    const filteredRecords = getFilteredRecords();

    const handleWeekChange = (offset) => {
        const d = new Date(selectedWeek);
        d.setDate(d.getDate() + (offset * 7));
        setSelectedWeek(d.toISOString().split('T')[0]);
    };

    const formatWeekRange = () => {
        const start = new Date(selectedWeek);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
    };

    return (
        <StudentLayout title="Attendance Detail">
            <div className="max-w-4xl mx-auto">
                {/* Header / Back Button */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/student/attendance')}
                        className="p-2 bg-white border border-gray-100 rounded-md shadow-sm hover:bg-gray-50 transition-colors text-gray-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">
                            {subjectInfo ? subjectInfo.subjectName : 'Subject Attendance'}
                        </h1>
                        <p className="text-gray-500 font-medium text-sm">
                            Detailed day-wise presence records {subjectInfo?.subjectCode ? `(${subjectInfo.subjectCode})` : ''}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full rounded-md" />
                        <Skeleton className="h-64 w-full rounded-md" />
                    </div>
                ) : error ? (
                    <div className="p-8 bg-rose-50 border border-rose-100 rounded-md text-rose-600 text-center font-bold">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Stats for this subject */}
                        {subjectInfo && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Percentage</p>
                                    <p className={`text-xl font-black ${subjectInfo.percentage >= 75 ? 'text-emerald-600' : subjectInfo.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                        {subjectInfo.percentage}%
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                                    <p className="text-xl font-black text-gray-900">{subjectInfo.total}</p>
                                </div>
                                <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Present</p>
                                    <p className="text-xl font-black text-emerald-600">{subjectInfo.present}</p>
                                </div>
                                <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Missed</p>
                                    <p className="text-xl font-black text-rose-600">{subjectInfo.absent + subjectInfo.late}</p>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                            <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
                                <button
                                    onClick={() => setFilterMode('last5')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filterMode === 'last5' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Last 5 Days
                                </button>
                                <button
                                    onClick={() => setFilterMode('week')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${filterMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Week-wise
                                </button>
                            </div>

                            {filterMode === 'week' && (
                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                    <button
                                        onClick={() => handleWeekChange(-1)}
                                        className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600 transition-colors"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100 min-w-[140px] text-center">
                                        {formatWeekRange()}
                                    </span>
                                    <button
                                        onClick={() => handleWeekChange(1)}
                                        className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Records Table */}
                        <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">

                            {/* Header */}
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider">
                                    Attendance Register
                                </h3>

                                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <Calendar size={12} />
                                    <span>{filteredRecords.length} Records Shown</span>
                                </div>
                            </div>

                            {filteredRecords.length > 0 ? (
                                <div className="overflow-x-auto">

                                    <table className="w-full text-xs sm:text-sm text-left min-w-[520px]">

                                        {/* Table Head */}
                                        <thead className="bg-gray-50 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <tr>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4">Date</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4">Day</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4">Status</th>
                                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Time</th>
                                            </tr>
                                        </thead>

                                        {/* Table Body */}
                                        <tbody className="divide-y divide-gray-100 font-medium">
                                            {filteredRecords.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">

                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-gray-900">
                                                        {new Date(item.attendanceDate).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </td>

                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500">
                                                        {new Date(item.attendanceDate).toLocaleDateString('en-GB', {
                                                            weekday: 'short'
                                                        })}
                                                    </td>

                                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-md border ${item.status === 'Present'
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    : item.status === 'Late'
                                                                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                                                }`}
                                                        >
                                                            {item.status === 'Present' ? (
                                                                <CheckCircle2 size={10} />
                                                            ) : item.status === 'Late' ? (
                                                                <Clock size={10} />
                                                            ) : (
                                                                <XCircle size={10} />
                                                            )}
                                                            {item.status}
                                                        </span>
                                                    </td>

                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-400 tabular-nums">
                                                        {item.createdAt
                                                            ? new Date(item.createdAt).toLocaleTimeString('en-GB', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : '--:--'}
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>

                                    </table>

                                </div>
                            ) : (

                                <div className="py-14 sm:py-20 text-center px-4">
                                    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-50 text-gray-200 rounded-md flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                        <BookOpen size={28} />
                                    </div>

                                    <h4 className="text-gray-900 font-bold mb-1 text-sm">No Data Found</h4>

                                    <p className="text-gray-400 text-xs text-balance max-w-[280px] mx-auto">
                                        {filterMode === 'last5' 
                                            ? 'There are no recent attendance records for this subject.' 
                                            : `No attendance records found for the week ${formatWeekRange()}.`}
                                    </p>
                                </div>

                            )}
                        </div>

                        {/* Note Section */}
                        <div className="p-6 bg-gray-50 border border-gray-100 rounded-md flex items-start gap-4">
                            <AlertCircle size={20} className="text-gray-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-1">Data Verification</h4>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    This register is updated in real-time by the faculty. If you find any discrepancies, please submit an inquiry form through the support section.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};


export default SubjectAttendanceDetail;
