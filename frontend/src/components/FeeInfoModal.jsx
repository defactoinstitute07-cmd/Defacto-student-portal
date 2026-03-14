import React from 'react';
import { X, User, Calendar, IndianRupee, CreditCard, MapPin, Phone, Mail, BadgeInfo, CheckCircle2, History } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const FeeInfoModal = ({ isOpen, onClose, fee, student }) => {
    const { t } = useLanguage();
    if (!isOpen || !fee) return null;

    const currentStudent = (fee.studentId && typeof fee.studentId === 'object') ? fee.studentId : (student || {});
    const fmt = n => (n || 0).toLocaleString('en-IN');

    // Calculations
    const totalReceived = (fee.amountPaid || 0);
    const balance = (fee.totalFee || 0) - totalReceived;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
               <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-6 py-5 flex items-center justify-between text-white shadow-md sticky top-0 z-20 border-b border-indigo-400/30">
    <div className="flex items-center gap-4">
        {/* Glassmorphism Icon Container */}
        <div className="bg-white/15 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-sm shrink-0">
            <IndianRupee size={22} className="text-white drop-shadow-sm" />
        </div>
        
        <div className="flex flex-col justify-center">
            <h2 className="text-xl font-bold tracking-tight text-white mb-1.5 leading-none">
                {t('Fee Details')}
            </h2>
            
            {/* Upgraded Info Pill */}
            <div className="flex items-center">
                <p className="text-indigo-50 text-[11px] font-semibold tracking-wide bg-black/15 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-inner">
                    {/* Optional indicator dot - makes the status pop */}
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]"></span>
                    <span>{fee.month} {fee.year}</span>
                    <span className="opacity-40 font-normal px-0.5">|</span>
                    <span className="uppercase tracking-wider">{t(fee.status)}</span>
                </p>
            </div>
        </div>
    </div>
    
    {/* Refined Close Button */}
    <button 
        onClick={onClose}
        className="p-2.5 bg-black/5 hover:bg-black/20 rounded-full transition-all duration-200 active:scale-90 border border-transparent hover:border-white/10 group"
        aria-label="Close"
    >
        <X size={20} className="text-indigo-100 group-hover:text-white transition-colors" />
    </button>
</div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    {/* Student Mini Profile */}
                    <div className="p-5 bg-white border-b border-slate-100">
                        <div className="flex items-start gap-4">
                            <div className="h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl font-bold border-2 border-indigo-50 shadow-inner">
                                {currentStudent.name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900">{currentStudent.name}</h3>
                                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                                        <BadgeInfo size={14} className="text-indigo-400" />
                                        <span>{t('ID')}: <span className="text-slate-900">{currentStudent.rollNo}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>{t('Course')}: <span className="text-slate-900">{(currentStudent.className || 'N/A').toUpperCase()}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expandable Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-50">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><User size={14} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none mb-1">{t('Parent Details')}</span>
                                        <span className="text-slate-700 font-medium text-xs leading-tight">F: {currentStudent.fatherName || 'N/A'}</span>
                                        <span className="text-slate-700 font-medium text-xs leading-tight">M: {currentStudent.motherName || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Phone size={14} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none mb-1">{t('Contact')}</span>
                                        <span className="text-slate-700 font-medium text-xs">{currentStudent.contact || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><Calendar size={14} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none mb-1">{t('Date of Birth')}</span>
                                        <span className="text-slate-700 font-medium text-xs">{currentStudent.dob ? new Date(currentStudent.dob).toLocaleDateString('en-GB') : 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500"><MapPin size={14} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none mb-1">{t('Address')}</span>
                                        <span className="text-slate-700 font-medium text-xs line-clamp-1">{currentStudent.address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Section */}
                    <div className="p-5">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                            <BadgeInfo size={16} className="text-indigo-500" />
                            {t('Payment Breakdown')}
                        </h4>
                        
                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-100 italic">
                                    <span className="text-xs text-slate-400">{t('Item Description')}</span>
                                    <span className="text-xs text-slate-400">{t('Amount')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 font-medium">{t('Tuition Fee')}</span>
                                    <span className="text-slate-900 font-bold">₹{fmt(fee.monthlyTuitionFee)}</span>
                                </div>
                                {fee.registrationFee > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">{t('Registration Fee')}</span>
                                        <span className="text-slate-900 font-bold">₹{fmt(fee.registrationFee)}</span>
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
                                        <span className="text-slate-600 font-medium font-bold">{exp.title}</span>
                                        <span className="text-slate-900 font-bold font-bold">₹{fmt(exp.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-indigo-50 px-4 py-4 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none">
                                    <span>{t('Total Payable')}</span>
                                    <span>₹{fmt(fee.totalFee)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-emerald-500 uppercase tracking-widest leading-none">
                                    <span>{t('Amount Paid')}</span>
                                    <span>₹{fmt(totalReceived)}</span>
                                </div>
                                <div className="pt-2 border-t border-indigo-100 flex justify-between items-center text-sm font-black text-indigo-900 uppercase tracking-wide">
                                    <span>{t('Net Balance')}</span>
                                    <span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
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
                        
                        {fee.paymentHistory && fee.paymentHistory.length > 0 ? (
                            <div className="space-y-3">
                                {fee.paymentHistory.map((p, i) => (
                                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500 opacity-20" />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-1.5 leading-none">
                                                    <CreditCard size={12} className="text-indigo-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.paymentMethod}</span>
                                                </div>
                                                <div className="text-base font-black text-slate-900 mt-1">₹{fmt(p.paidAmount)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-900">{new Date(p.date).toLocaleDateString('en-GB')}</div>
                                                <div className="text-[10px] font-medium text-slate-400 mt-0.5">{p.receiptNo || 'N/A'}</div>
                                            </div>
                                        </div>
                                        {p.transactionId && (
                                            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">TXN ID:</span>
                                                <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">{p.transactionId}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                                <p className="text-sm italic">{t('No transaction records found.')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 bg-white border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all outline-none"
                    >
                        {t('Close')}
                    </button>
                    {balance <= 0 && (
                        <div className="flex-[1.5] flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 rounded-xl px-4 py-3 border border-emerald-100 font-bold text-sm">
                            <CheckCircle2 size={18} />
                            {t('Full Paid Receipt')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeeInfoModal;
