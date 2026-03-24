import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Lock, RefreshCcw, AlertTriangle,
    CheckCircle2, Bell
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const StudentSettings = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const pushEnabledInBuild = import.meta.env.VITE_ENABLE_PUSH === 'true';
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pushStatus, setPushStatus] = useState(() => {
        if (!pushEnabledInBuild) return 'disabled';
        return localStorage.getItem('pushNotificationsEnabled') === 'true' ? 'granted' : 'idle';
    });
    const [pushNotice, setPushNotice] = useState('');
    const [pushLoading, setPushLoading] = useState(false);
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

    const handleEnableNotifications = async () => {
        setPushLoading(true);
        setPushNotice('');

        try {
            const { registerPushNotifications } = await import('../services/pushNotifications');
            const result = await registerPushNotifications({ requestPermission: true });

            if (result.ok) {
                setPushStatus('granted');
                setPushNotice(t('Notifications enabled for this device.'));
            } else {
                setPushStatus(result.reason || 'error');
                setPushNotice(result.message || t('Unable to enable notifications right now.'));
            }
        } catch (err) {
            setPushStatus('error');
            setPushNotice(t('Unable to enable notifications right now.'));
        } finally {
            setPushLoading(false);
        }
    };

    const pushStatusClass = pushStatus === 'granted'
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
    
    const pushStatusLabel = pushStatus === 'granted'
        ? t('Enabled')
        : pushStatus === 'unsupported'
            ? t('App Only')
            : pushStatus === 'disabled'
                ? t('Disabled')
                : t('Not Enabled');

    return (
        <StudentLayout title="Settings">
            <div className="w-full max-w-md mx-auto pb-24 sm:pb-12 animate-in fade-in duration-300 bg-gray-50 min-h-screen">
                
                {/* Security Section */}
                <div className="pt-6 px-4 mb-6 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Lock size={16} className="text-rose-500" />
                        <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t('Security')}</h3>
                    </div>
                    
                    <div className="bg-white rounded-md border border-gray-100 shadow-sm p-5">
                        {(error || success) && (
                            <div className={`p-3.5 rounded-md mb-5 flex items-start gap-3 animate-in slide-in-from-top-2 ${error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
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
                                    className="w-full px-4 h-12 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                                    placeholder={t('Enter current password')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('New Password')}</label>
                                <input
                                    type="password" name="newPassword" required
                                    value={pwdData.newPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                                    placeholder={t('Enter new password')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('Confirm Password')}</label>
                                <input
                                    type="password" name="confirmPassword" required
                                    value={pwdData.confirmPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                                    placeholder={t('Confirm new password')}
                                />
                            </div>
                            <button
                                type="submit" disabled={pwdLoading}
                                className="w-full mt-2 h-12 bg-gray-900 text-gray-900 text-xs font-black uppercase tracking-widest rounded-md active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-gray-900/10 flex items-center justify-center gap-2"
                            >
                                {pwdLoading && <RefreshCcw size={14} className="animate-spin" />}
                                {pwdLoading ? t('Validating...') : t('Update Password')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="px-4 mb-6 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Bell size={16} className="text-blue-500" />
                        <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t('Notifications')}</h3>
                    </div>

                    <div className="bg-white rounded-md border border-gray-100 shadow-sm p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{t('Push Notifications')}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('Enable alerts on this phone for announcements and updates.')}
                                </p>
                            </div>
                            <span className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${pushStatusClass}`}>
                                {pushStatusLabel}
                            </span>
                        </div>

                        {pushNotice && (
                            <div className={`p-3 rounded-md text-xs font-bold ${pushStatus === 'granted' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {pushNotice}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleEnableNotifications}
                            disabled={pushLoading || !pushEnabledInBuild}
                            className="w-full mt-2 h-12 bg-blue-600 text-gray-900 text-xs font-black uppercase tracking-widest rounded-md active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            {pushLoading && <RefreshCcw size={14} className="animate-spin" />}
                            {pushLoading
                                ? t('Enabling...')
                                : pushStatus === 'granted'
                                    ? t('Refresh Notification Setup')
                                    : t('Enable Notifications')}
                        </button>
                    </div>
                </div>

            </div>
        </StudentLayout>
    );
};

export default StudentSettings;
