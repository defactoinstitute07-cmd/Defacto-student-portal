import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import { BookOpen, User, ArrowRight, GraduationCap, Search } from 'lucide-react';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';

const StudentSubjects = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/student/me');
                if (res.data.success && res.data.student.subjectTeachers) {
                    setSubjects(res.data.student.subjectTeachers);
                }
            } catch (err) {
                console.error('Error fetching subjects:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, []);

    const filteredSubjects = subjects.filter(s =>
        s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <StudentLayout title="My Subjects">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <Skeleton className="h-10 w-64 mb-2" />
                            <Skeleton className="h-4 w-80" />
                        </div>
                        <Skeleton className="h-12 w-full md:w-80 rounded-md" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-md border border-gray-100 p-6 space-y-4">
                                <Skeleton className="h-12 w-12 rounded-md" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="space-y-2 pt-4">
                                    <Skeleton className="h-2 w-full" />
                                    <Skeleton className="h-2 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="My Subjects">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Curriculum</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage your enrolled subjects and subject specialists.</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search subjects or teachers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                        />
                    </div>
                </div>

                {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSubjects.map((s, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/student/results/subject/${s.subject}`)}
                                className="group bg-white rounded-md border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                            >
                                {/* Card Header / Color Accent */}
                                <div className="h-2 bg-blue-500 group-hover:h-3 transition-all" />

                                {/* Reduced padding on mobile (p-4) vs desktop (sm:p-6) */}
                                <div className="p-4 sm:p-6 flex-1 flex flex-col">

                                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                                        <div className="p-2 sm:p-3 bg-blue-50 rounded-md text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <BookOpen size={20} className="sm:w-6 sm:h-6 shrink-0" />
                                        </div>
                                        <div className="px-2.5 py-1 sm:px-3 sm:py-1 bg-gray-50 text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-md border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            Active
                                        </div>
                                    </div>

                                    {/* Scaled title for smaller screens */}
                                    <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1.5 sm:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {s.subject}
                                    </h3>

                                    {/* Added truncate for long teacher names so it doesn't break into two lines awkwardly */}
                                    <div className="flex items-center gap-2 text-gray-500 mb-4 font-bold text-xs sm:text-sm">
                                        <User size={14} className="text-gray-400 shrink-0" />
                                        <span className="truncate">{s.teacher === 'Unassigned' ? 'Unassigned' : `Faculty : ${s.teacher}`}</span>
                                    </div>

                                    {/* Average Marks Section */}
                                    <div className="mt-2 mb-5 sm:mb-6">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider">Avg. Test Score : </span>
                                            <span className={`text-xs sm:text-sm font-black ${s.averageMarks >= 75 ? 'text-green-600' : s.averageMarks >= 40 ? 'text-blue-600' : 'text-rose-600'}`}>
                                                {s.averageMarks} %
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${s.averageMarks >= 75 ? 'bg-green-500' : s.averageMarks >= 40 ? 'bg-blue-500' : 'bg-rose-500'}`}
                                                style={{ width: `${s.averageMarks}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer Area */}
                                    <div className="mt-auto flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-50">
                                        <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                                            <GraduationCap size={14} className="shrink-0" /> Subject Hub
                                        </span>
                                        <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-blue-50 text-gray-300 group-hover:text-blue-500 transition-all shrink-0">
                                            <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-md border-2 border-dashed border-gray-200 p-12 text-center">
                        <div className="max-w-sm mx-auto space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                <Search size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No subjects found</h3>
                            <p className="text-gray-500 text-sm">We couldn't find any subjects assigned to your batch. Please contact the administration if this is an error.</p>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentSubjects;
