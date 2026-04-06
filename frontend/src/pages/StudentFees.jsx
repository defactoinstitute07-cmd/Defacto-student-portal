import React, { useState, useMemo } from 'react';
import { 
    AlertCircle,
    CalendarDays,
    Wallet
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';
import Skeleton from '../components/Skeleton';
import FeeInfoModal from '../components/FeeInfoModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StudentFees = () => {
    const { t } = useLanguage();
    const [selectedFee, setSelectedFee] = useState(null);

    const { data: feesData, isLoading } = useQuery({
        queryKey: ['student', 'fees'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/student/fees');
                if (data.success) {
                    await setCached('student.fees', data.fees);
                    return data.fees;
                }
            } catch (err) {
                // Browsers can return 304 for conditional requests; axios treats it as an error.
                if (err?.response?.status !== 401) {
                    const cached = await getCached('student.fees');
                    if (cached) return cached;
                }

                throw err;
            }

            return [];
        },
        retry: 1,
        refetchOnWindowFocus: false
    });

    const fees = useMemo(() => feesData || [], [feesData]);
    const pendingFees = useMemo(() => {
        return fees.filter((fee) => Number(fee.pendingAmount || 0) > 0 || fee.status !== 'paid');
    }, [fees]);

    const paidFees = useMemo(() => {
        return fees.filter((fee) => Number(fee.pendingAmount || 0) <= 0 && fee.status === 'paid');
    }, [fees]);

    const stats = useMemo(() => {
        const pendingDues = pendingFees.reduce((sum, fee) => sum + Number(fee.pendingAmount || 0), 0);
        return { pendingDues, pendingCount: pendingFees.length };
    }, [pendingFees]);

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyChartData = useMemo(() => {
        const monthlyTotals = monthLabels.map((label) => {
            const lower = label.toLowerCase();
                return pendingFees.reduce((sum, fee) => {
                const feeMonth = String(fee.month || '').toLowerCase();
                if (!feeMonth.startsWith(lower)) return sum;
                const pendingAmount = fee.pendingAmount > 0 ? Number(fee.pendingAmount) : 0;
                    return sum + pendingAmount;
            }, 0);
        });

        return {
            labels: monthLabels,
            datasets: [
                {
                    label: t('Pending amount'),
                    data: monthlyTotals,
                    backgroundColor: 'rgba(148, 163, 184, 0.85)',
                    borderRadius: 6,
                    maxBarThickness: 24
                }
            ]
        };
    }, [pendingFees, t]);

    const monthlyChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `₹${fmt(ctx.parsed.y)}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 10 }
                }
            },
            y: {
                grid: {
                    color: 'rgba(148, 163, 184, 0.2)'
                },
                ticks: {
                    callback: (value) => `₹${value}`,
                    font: { size: 10 }
                }
            }
        }
    };

    const fmt = n => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    if (isLoading) {
        return (
            <div className="animate-in fade-in duration-500 min-h-screen bg-[#f4f8f7] pb-16">
                <div className="px-5 sm:px-7 pt-8 pb-3">
                    <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 shadow-sm">
                        <Skeleton className="h-7 w-44 mb-3" />
                        <Skeleton className="h-4 w-72 mb-5" />
                        <Skeleton className="h-2.5 w-full rounded-[15px]" />
                    </div>
                </div>
                <div className="max-w-5xl mx-auto px-5 sm:px-7 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <Skeleton className="h-28 w-full rounded-[15px]" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-52" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-[15px]" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#eff6ff,transparent_40%),radial-gradient(circle_at_80%_20%,#fff7ed,transparent_40%),#f8fafc] pb-16 selection:bg-sky-200/60">
            <div className="p0">
                <div className="max-w-5xl mx-auto   rounded-[10px] border border-sky-100 bg-white/90 backdrop-blur-sm shadow-[0_20px_45px_-35px_rgba(2,132,199,0.55)] overflow-hidden">
                    <div className="bg-[linear-gradient(110deg,#172554_0%,#1d4ed8_60%,#1e40af_100%)] p-6 sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] sm:text-xs uppercase tracking-[0.22em] font-extrabold text-sky-100/90 mb-2">
                                    {t('Financial Overview')}
                                </p>
                                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                                    {t('Fees & Payments Ledger')}
                                </p>
                                <p className="text-sm text-sky-50/85 mt-2 max-w-xl">
                                    {t('View and clear your pending fee dues quickly.')}
                                </p>
                            </div>
                            <div className="hidden sm:flex w-14 h-14   rounded-[10px] items-center justify-center bg-white/15 border border-white/20 text-white shrink-0">
                                <Wallet size={30} strokeWidth={1.8} />
                            </div>
                        </div>

                        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-sky-100/90">
                            {stats.pendingCount} {t('pending records')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p0 sm:p0 mt-5 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-rose-50 border border-rose-400   rounded-[10px] p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black tracking-[0.16em] uppercase text-rose-500">{t('Pending Dues')}</span>
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                <AlertCircle size={16} strokeWidth={2.6} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-rose-700 tracking-tight tabular-nums">₹{fmt(stats.pendingDues)}</p>
                        <p className="text-xs text-slate-500 mt-2">{stats.pendingDues > 0 ? t('Action required this cycle') : t('No outstanding dues')}</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                            <CalendarDays size={16} strokeWidth={2.4} />
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                            {t('Monthly Breakdown')}
                        </h2>
                    </div>
                    <div className="p-4 sm:p-5">
                        {pendingFees.length > 0 ? (
                            <>
                                <div className="space-y-3 mb-4">
                                    {pendingFees.map((fee) => {
                                        return (
                                            <button
                                                key={fee._id}
                                                type="button"
                                                onClick={() => setSelectedFee(fee)}
                                                className="w-full rounded-[999px] border px-4 py-3 flex items-center justify-between text-sm shadow-sm transition-all active:scale-[0.99] bg-rose-50 border-rose-100 text-rose-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-2.5 h-2.5   rounded-[10px] bg-rose-500" />
                                                    <span className="font-semibold text-slate-900">
                                                        {fee.month} {fee.year}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
                                                    {t('Pending')}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="h-52 sm:h-64 w-full">
                                    <Bar data={monthlyChartData} options={monthlyChartOptions} />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16 bg-white   rounded-[10px] border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-100   rounded-[10px] flex items-center justify-center text-slate-500 mb-4">
                                    <Wallet size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-1">{t('No Pending Fees')}</h3>
                                <p className="text-sm font-medium text-slate-400 max-w-[220px] mx-auto">{t('All dues are cleared for now.')}</p>
                            </div>
                        )}

                        {paidFees.length > 0 && (
                            <>
                                <div className="mt-8 mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-black tracking-[0.16em] uppercase text-emerald-700">
                                        {t('Payment History')}
                                    </h3>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                        {paidFees.length} {t('Paid')}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {paidFees.map((fee) => (
                                        <button
                                            key={fee._id}
                                            type="button"
                                            onClick={() => setSelectedFee(fee)}
                                            className="w-full rounded-[999px] border px-4 py-3 flex items-center justify-between text-sm shadow-sm transition-all active:scale-[0.99] bg-emerald-50 border-emerald-100 text-emerald-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-2.5 h-2.5   rounded-[10px] bg-emerald-500" />
                                                <span className="font-semibold text-slate-900">
                                                    {fee.month} {fee.year}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                                                {t('Paid')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <FeeInfoModal
            isOpen={Boolean(selectedFee)}
            onClose={() => setSelectedFee(null)}
            fee={selectedFee}
            student={fees[0]?.studentId}
        />

        </>
    );
};

export default StudentFees;