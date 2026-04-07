import React from 'react';
import { X, User, Calendar, IndianRupee, CreditCard, MapPin, Phone, Mail, BadgeInfo, History } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggleButton from './LanguageToggleButton';

const FeeInfoModal = ({ isOpen, onClose, fee, student }) => {
    const { t } = useLanguage();
    if (!isOpen || !fee) return null;

    const currentStudent = (fee.studentId && typeof fee.studentId === 'object') ? fee.studentId : (student || {});
    const fmt = n => (n || 0).toLocaleString('en-IN');
    const paymentRows = Array.isArray(fee.paymentHistory)
        ? fee.paymentHistory.map((row) => ({
            amount: row?.paidAmount ?? row?.amount ?? 0,
            method: row?.paymentMethod || row?.method || row?.mode || 'N/A',
            date: row?.date || row?.paidDate || null,
            receiptNo: row?.receiptNo || row?.receipt || row?.receiptNumber || 'N/A',
            transactionId: row?.transactionId || row?.paymentId || row?.referenceNo || null
        }))
        : [];
    const formatTxnDate = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? 'N/A'
            : date.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    };

    // Calculations
    const toNum = (value) => Number(value || 0);
    const totalReceived = toNum(fee.amountPaid);
    const otherExpensesTotal = Array.isArray(fee.otherExpenses)
        ? fee.otherExpenses.reduce((sum, exp) => sum + toNum(exp?.amount), 0)
        : 0;
    const baseCharges =
        toNum(fee.monthlyTuitionFee) +
        toNum(fee.registrationFee) +
        toNum(fee.fine) +
        otherExpensesTotal;
    const netPayable = toNum(fee.totalFee);
    const explicitDiscount = toNum(
        fee.discountAmount ?? fee.discount ?? fee.concession ?? fee.waiver ?? fee.scholarshipAmount
    );
    const inferredDiscount = baseCharges > 0 ? Math.max(baseCharges - netPayable, 0) : 0;
    const discountAmount = explicitDiscount > 0 ? explicitDiscount : inferredDiscount;
    const grossPayable = baseCharges > 0 ? Math.max(baseCharges, netPayable) : netPayable + discountAmount;
    const balance = netPayable - totalReceived;
    const isFullyPaid = balance <= 0 || String(fee.status).toLowerCase() === 'paid';

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:   rounded-[10px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
               <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-6 py-5 flex items-center justify-between text-gray-900 shadow-md sticky top-0 z-20 border-b border-indigo-400/30">
    <div className="flex items-center gap-4">
        {/* Glassmorphism Icon Container */}
        <div className="bg-white/15 backdrop-blur-md p-2.5   rounded-[10px] border border-white/20 shadow-sm shrink-0">
            <IndianRupee size={22} className="text-white drop-shadow-sm" />
        </div>
        
        <div className="flex flex-col justify-center">
            <p className="text-xl font-bold tracking-tight text-white mb-1.5 leading-none">
                {t('Fee Details')}
            </p>
            
            {/* Upgraded Info Pill */}
            <div className="flex items-center">
                <p className="text-indigo-50 text-[11px] font-semibold tracking-wide bg-black/15 px-3 py-1   rounded-[10px] border border-gray-200 flex items-center gap-1.5 shadow-inner">
                    {/* Optional indicator dot - makes the status pop */}
                    <span className="w-1.5 h-1.5   rounded-[10px] bg-indigo-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]"></span>
                    <span>{fee.month} {fee.year}</span>
                    <span className="opacity-40 font-normal px-0.5">|</span>
                    <span className="uppercase tracking-wider">{t(fee.status)}</span>
                </p>
            </div>
        </div>
    </div>
    
    <div className="flex items-center gap-2">
        <LanguageToggleButton
            variant="topbar"
            className="bg-white/15 border-white/25 text-white hover:bg-white/20"
        />

        {/* Refined Close Button */}
        <button 
            onClick={onClose}
            className="p-2.5 bg-black/5 hover:bg-black/20   rounded-[10px] transition-all duration-200 active:scale-90 border border-transparent hover:border-gray-200 group"
            aria-label="Close"
        >
            <X size={20} className="text-indigo-100 group-hover:text-gray-900 transition-colors" />
        </button>
    </div>
</div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                  

                    {/* Breakdown Section */}
                    <div className="p-5">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                            <BadgeInfo size={16} className="text-indigo-500" />
                            {t('Payment Breakdown')}
                        </h4>
                        
                        <div className="bg-white   rounded-[10px] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-100 italic">
                                    <span className="text-xs text-slate-400">{t('Item Description')}</span>
                                    <span className="text-xs text-slate-400">{t('Amount')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-900/60 font-medium">{t('Tuition Fee')}</span>
                                    <span className="text-gray-900 font-bold">₹{fmt(fee.monthlyTuitionFee)}</span>
                                </div>
                                {fee.registrationFee > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-900/60 font-medium">{t('Registration Fee')}</span>
                                        <span className="text-gray-900 font-bold">₹{fmt(fee.registrationFee)}</span>
                                    </div>
                                )}
                                {fee.fine > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-red-500 font-medium font-bold">{t('Late Fine')}</span>
                                        <span className="text-red-600 font-bold font-bold">₹{fmt(fee.fine)}</span>
                                    </div>
                                )}
                                {fee.otherExpenses?.map((exp, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-900/60 font-medium font-bold">{exp.title}</span>
                                        <span className="text-gray-900 font-bold font-bold">₹{fmt(exp.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-slate-50 px-4 py-4 space-y-3">
                                <div className={`grid grid-cols-1 gap-2 ${discountAmount > 0 ? 'sm:grid-cols-2' : ''}`}>
                                    <div className="   rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">{t('Gross Charges')}</p>
                                        <p className="mt-1 text-sm font-black text-amber-900">₹{fmt(grossPayable)}</p>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="   rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">{t('Discount Applied')}</p>
                                        <p className="mt-1 text-sm font-black text-emerald-700">- ₹{fmt(discountAmount)}</p>
                                        </div>
                                    )}
                                </div>

                                {discountAmount > 0 && (
                                    <div className="   rounded-[10px] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50 to-teal-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                        {t('You Saved')} ₹{fmt(discountAmount)}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="   rounded-[10px] border border-indigo-200 bg-indigo-50 px-3 py-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">{t('Total Payable')}</p>
                                        <p className="mt-1 text-sm font-black text-indigo-900">₹{fmt(netPayable)}</p>
                                    </div>
                                    <div className="   rounded-[10px] border border-sky-200 bg-sky-50 px-3 py-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-600">{t('Amount Paid')}</p>
                                        <p className="mt-1 text-sm font-black text-sky-700">₹{fmt(totalReceived)}</p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black uppercase tracking-wide text-slate-800">
                                    <span>{t('Net Balance')}</span>
                                    <span className={balance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                                        ₹{fmt(balance)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="p-5">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                            <History size={16} className="text-indigo-500" />
                            {t('Transaction History')}
                        </h4>
                        
                        {paymentRows.length > 0 ? (
                            <div className="bg-white   rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                    <CreditCard size={14} className="text-indigo-500" />
                                    <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_minmax(0,0.9fr)_minmax(0,1.5fr)] gap-2 w-full text-[10px] font-semibold text-slate-400 uppercase tracking-[0.16em]">
                                        <span>{t('Method')}</span>
                                        <span>{t('Date & Time')}</span>
                                        <span>{t('Amount')}</span>
                                     
                                    </div>
                                </div>
                                {paymentRows.map((p, i) => (
                                    <div key={i} className="px-4 py-3 border-t border-slate-50 text-sm bg-white">
                                        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)_minmax(0,0.9fr)_minmax(0,1.5fr)] gap-2 items-center">
                                            <div className="font-medium text-slate-800 truncate">{p.method}</div>
                                            <div className="text-xs text-slate-500 leading-snug">{formatTxnDate(p.date)}</div>
                                            <div className="font-semibold text-slate-900 tabular-nums">₹{fmt(p.amount)}</div>
                                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 truncate">
                                               
                                                {isFullyPaid && (
                                                    <span className="inline-flex items-center   rounded-[10px] bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                                                        {t('Paid')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                            <span className="font-semibold tracking-[0.18em] uppercase">{t('Reference Number')}</span>
                                            <span className="font-mono text-[11px] text-slate-600 truncate max-w-[60%] text-right">
                                               {p.receiptNo || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-white   rounded-[10px] border border-dashed border-white/8 text-slate-400">
                                <p className="text-sm italic">{t('No transaction records found.')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 bg-white border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white text-gray-900 font-semibold text-sm shadow-[0_1px_0_rgba(15,23,42,0.03)] hover:bg-slate-50 active:scale-[0.98] transition-all outline-none"
                    >
                        {t('Close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeeInfoModal;
