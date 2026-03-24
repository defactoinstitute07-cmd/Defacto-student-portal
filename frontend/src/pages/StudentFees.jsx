import React, { useState, useEffect } from 'react';
import { 
    AlertCircle, 
    CheckCircle2, 
    Download, 
    Wallet,
    CalendarDays, 
    ChevronDown, 
    FileText,
    Receipt,
    CreditCard
} from 'lucide-react';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';
import { generateFeeReceipt } from '../utils/receiptGenerator';
import Skeleton from '../components/Skeleton';

const StudentFees = () => {
    const { t } = useLanguage();
    const [expandedFee, setExpandedFee] = useState(null);
    const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

    const { data: feesData, isLoading } = useQuery({
        queryKey: ['student', 'fees'],
        queryFn: async () => {
            const { data } = await api.get('/student/fees');
            if (data.success) {
                await setCached('student.fees', data.fees);
                return data.fees;
            }
            return [];
        }
    });

    const fees = React.useMemo(() => feesData || [], [feesData]);
    const stats = React.useMemo(() => {
        let paid = 0;
        let pending = 0;
        fees.forEach(f => {
            paid += (f.amountPaid || 0);
            pending += (f.pendingAmount > 0 ? f.pendingAmount : 0);
        });
        return { totalPaid: paid, pendingDues: pending };
    }, [fees]);

    useEffect(() => {
        if (fees.length > 0 && !hasAutoExpanded) {
            const firstUnpaid = fees.find(f => f.status !== 'paid');
            if (firstUnpaid) {
                setExpandedFee(firstUnpaid._id);
            }
            setHasAutoExpanded(true);
        }
    }, [fees, hasAutoExpanded]);

    const fmt = n => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="animate-in fade-in duration-500">
                <div className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-sm border-b border-slate-100 mb-6">
                    <div className="flex flex-col items-center text-center max-w-lg mx-auto">
                        <Skeleton className="w-16 h-16 rounded-2xl mb-5" />
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="max-w-3xl mx-auto px-5 sm:px-6 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-32 w-full rounded-[28px]" />
                        <Skeleton className="h-32 w-full rounded-[28px]" />
                    </div>
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-5 w-40 mb-5" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-[28px]" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans selection:bg-indigo-100">
            {/* Hero Header Area */}
            <div className="bg-white px-6 pt-10 pb-8 rounded-b-[40px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border-b border-slate-100">
                <div className="flex flex-col items-center text-center max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-indigo-50/50 rounded-2xl flex items-center justify-center text-[#191838] mb-5 shadow-sm border border-indigo-100/50">
                        <Wallet size={32} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        {t('Financial Overview')}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 max-w-[280px]">
                        {t('Manage your tuition, view payment history, and download receipts.')}
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-5 sm:px-6 -mt-6 relative z-10 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Pending Dues */}
                    <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                <AlertCircle size={16} strokeWidth={2.5} />
                            </div>
                            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                {t('Pending Dues')}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight tabular-nums">
                                ₹{fmt(stats.pendingDues)}
                            </h3>
                            {stats.pendingDues > 0 && (
                                <button className="text-[11px] font-bold text-[#191838] uppercase tracking-widest opacity-80 hover:opacity-100 transition-opacity mt-2 flex items-center gap-1">
                                    {t('Pay Now')} →
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Total Paid */}
                    <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={16} strokeWidth={2.5} />
                            </div>
                            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                {t('Total Paid')}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight tabular-nums">
                                ₹{fmt(stats.totalPaid)}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 truncate">
                                {t('Session')}: {fees[0]?.studentId?.session || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Breakdown Section */}
                <div>
                    <div className="flex items-center gap-3 mb-5 px-1">
                        <CalendarDays size={20} className="text-[#191838]" strokeWidth={2} />
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">
                            {t('Monthly Breakdown')}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {fees.length > 0 ? (
                            fees.map((fee) => {
                                const isPaid = fee.status === 'paid';
                                const isExpanded = expandedFee === fee._id;
                                const paidInfo = fee.paymentHistory && fee.paymentHistory.length > 0 ? fee.paymentHistory[0] : null;

                                return (
                                    <div 
                                        key={fee._id} 
                                        className={`bg-white rounded-[28px] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-indigo-100 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-50/50' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}
                                    >
                                        <div 
                                            className="p-5 sm:p-6 flex items-center justify-between cursor-pointer select-none"
                                            onClick={() => setExpandedFee(isExpanded ? null : fee._id)}
                                        >
                                            <div className="flex items-center gap-4 sm:gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                                    {isPaid ? <Receipt size={22} strokeWidth={2} /> : <FileText size={22} strokeWidth={2} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-extrabold text-slate-900 text-[15px] sm:text-[17px] tracking-tight mb-0.5">
                                                        {fee.month} {fee.year}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${isPaid ? 'bg-emerald-100/50 text-emerald-700' : 'bg-rose-100/50 text-rose-700'}`}>
                                                            {isPaid ? t('Paid') : t('Pending')}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-slate-400">
                                                            {isPaid ? formatDate(paidInfo?.date || fee.paidDate) : `${t('Due')} ${formatDate(fee.dueDate)}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="font-black text-slate-900 text-base sm:text-lg tabular-nums">
                                                    ₹{fmt(fee.totalFee)}
                                                </span>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                                    <ChevronDown size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="px-5 sm:px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                                                <div className="pt-5 border-t border-slate-100">
                                                    {isPaid && paidInfo && (
                                                        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100/80 flex flex-col sm:flex-row gap-4 sm:gap-8">
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Method')}</p>
                                                                <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                                                    <CreditCard size={14} className="text-slate-400" /> 
                                                                    {paidInfo.paymentMethod || t('Direct Transfer')}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Transaction ID')}</p>
                                                                <p className="text-sm font-bold text-slate-700 font-mono tracking-tight">
                                                                    {paidInfo.transactionId || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-3.5 mb-6">
                                                        <div className="flex justify-between items-center text-[13px] sm:text-sm">
                                                            <span className="text-slate-500 font-medium">{t('Tuition Fee')}</span>
                                                            <span className="font-bold text-slate-800 tabular-nums">₹{fmt(fee.monthlyTuitionFee)}</span>
                                                        </div>
                                                        
                                                        {fee.registrationFee > 0 && (
                                                            <div className="flex justify-between items-center text-[13px] sm:text-sm">
                                                                <span className="text-slate-500 font-medium">{t('Registration Fee')}</span>
                                                                <span className="font-bold text-slate-800 tabular-nums">₹{fmt(fee.registrationFee)}</span>
                                                            </div>
                                                        )}

                                                        {fee.otherExpenses?.map((expense, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-[13px] sm:text-sm">
                                                                <span className="text-slate-500 font-medium">{t(expense.title)}</span>
                                                                <span className="font-bold text-slate-800 tabular-nums">₹{fmt(expense.amount)}</span>
                                                            </div>
                                                        ))}

                                                        {fee.fine > 0 && (
                                                            <div className="flex justify-between items-center text-[13px] sm:text-sm">
                                                                <span className="text-slate-500 font-medium">{t('Late Fine')}</span>
                                                                <span className="font-bold text-rose-600 tabular-nums">₹{fmt(fee.fine)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-slate-100 border-dashed">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('Total Amount')}</span>
                                                            <span className="text-xl font-black text-[#191838] tabular-nums">₹{fmt(fee.totalFee)}</span>
                                                        </div>

                                                        <div className="flex gap-3">
                                                            {isPaid ? (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        generateFeeReceipt(fee);
                                                                    }}
                                                                    className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Download size={14} strokeWidth={2.5} /> {t('Download Receipt')}
                                                                </button>
                                                            ) : (
                                                                <button className="w-full sm:w-auto px-8 py-3 bg-[#191838] hover:bg-[#12112a] text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-md shadow-indigo-900/10 active:scale-95">
                                                                    {t('Pay Now')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                    <Wallet size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-1">{t('No Fees Found')}</h3>
                                <p className="text-sm font-medium text-slate-400 max-w-[200px]">{t('You do not have any fee records for this session yet.')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentFees;