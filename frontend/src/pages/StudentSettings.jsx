import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { clearAuthSession } from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Lock, RefreshCcw, AlertTriangle,
    CheckCircle2, Bell, LogOut
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const StudentSettings = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const token = localStorage.getItem('studentToken');

    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwdLoading, setPwdLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/student/login');
        }
    }, [navigate, token]);

    const handlePwdChange = (e) => {
        setPwdData({ ...pwdData, [e.target.name]: e.target.value });
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (pwdData.newPassword !== pwdData.confirmPassword) {
            setError(t('New passwords do not match.'));
            return;
        }

        setPwdLoading(true);
        try {
            const res = await api.post('/student/reset-password', {
                currentPassword: pwdData.currentPassword,
                newPassword: pwdData.newPassword
            });
            if (res.data.success) {
                setSuccess(t('Password updated successfully.'));
                setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to reset password.'));
        } finally {
            setPwdLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuthSession();
        navigate('/student/login', { replace: true });
    };

    return (
        <StudentLayout title="Settings">
            <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-24 sm:pb-12 animate-in fade-in duration-300 min-h-screen bg-[radial-gradient(circle_at_top,#e0e7ff_0%,#f8fafc_35%,#f8fafc_100%)]">
                <div className="mb-6   rounded-[10px] border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] sm:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{t('Preferences')}</p>
                    <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-slate-900">{t('Personalize your account settings')}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {t('Manage password security and notification preferences from one place.')}
                    </p>
                </div>

                {/* Security Section */}
                <section className="mb-6   rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                                <Lock size={16} />
                            </span>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">{t('Security')}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{t('Keep your account protected')}</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex px-3 py-1   rounded-[10px] bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border border-slate-200">
                            {t('Recommended')}
                        </span>
                    </div>

                    <div className="   rounded-[10px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                        {(error || success) && (
                            <div className={`p-3.5 rounded-xl mb-5 flex items-start gap-3 animate-in slide-in-from-top-2 ${error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                <div className="mt-0.5">
                                    {error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                </div>
                                <span className="text-xs font-bold leading-relaxed">{error || success}</span>
                            </div>
                        )}
                        
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('Current Password')}</label>
                                <input
                                    type="password" name="currentPassword" required
                                    value={pwdData.currentPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder={t('Enter current password')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('New Password')}</label>
                                <input
                                    type="password" name="newPassword" required
                                    value={pwdData.newPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder={t('Enter new password')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('Confirm Password')}</label>
                                <input
                                    type="password" name="confirmPassword" required
                                    value={pwdData.confirmPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder={t('Confirm new password')}
                                />
                            </div>
                            <button
                                type="submit" disabled={pwdLoading}
                                className="w-full mt-2 h-12 bg-[#191838] text-white text-xs font-black uppercase tracking-widest rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2"
                            >
                                {pwdLoading && <RefreshCcw size={14} className="animate-spin" />}
                                {pwdLoading ? t('Validating...') : t('Update Password')}
                            </button>

                            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                                {t('Use at least 8 characters with a mix of letters, numbers, and symbols.')}
                            </p>
                        </form>
                    </div>
                </section>

                {/* Logout Section */}
                <section className="mb-6 rounded-[10px] border border-rose-200/80 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-6">
                    <div className="flex items-center gap-2.5 mb-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                            <LogOut size={16} />
                        </span>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">{t('Logout')}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{t('Sign out from your account')}</p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {t('Your session will be cleared and you will be redirected to the login page. You can log back in anytime.')}
                    </p>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-widest rounded-xl active:scale-[0.98] transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        {t('Logout')}
                    </button>
                </section>

            </div>
        </StudentLayout>
    );
};

export default StudentSettings;
