import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Send, CheckCircle2, LifeBuoy } from 'lucide-react';
import LanguageToggleButton from '../components/LanguageToggleButton';
import api from '../services/api';

const SetupHelpForm = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', rollNo: '', whatsappNumber: '', preferredContactMethod: '', issue: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/support/ticket', formData);
            if (response.data.success) {
                setSuccess(true);
            } else {
                console.error("Failed to submit support request");
            }
        } catch (error) {
            console.error("API error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="absolute right-4 top-4 z-[120]">
                <LanguageToggleButton variant="topbar" />
            </div>

            <div className="relative z-10 w-full max-w-[500px] bg-white rounded-[15px] sm:rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-200 overflow-hidden mt-6 mb-6">
                <div className="px-6 pt-6 sm:px-8 sm:pt-8 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-600 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        <LifeBuoy size={14} />
                        {t('Support Team')}
                    </div>
                </div>

                <div className="px-6 py-6 sm:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('How can we help?')}</h2>
                        <p className="text-gray-500 text-sm mt-2 font-medium">{t('Fill out the form below and our support team will get back to you shortly.')}</p>
                    </div>

                    {success ? (
                        <div className="py-10 text-center space-y-4 animate-in fade-in duration-500">
                            <div className="h-20 w-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t('Request Submitted')}</h3>
                            <p className="text-sm text-gray-500 max-w-[280px] mx-auto font-medium">
                                {t('We have received your support request. Our team will contact you soon via your email or phone number.')}
                            </p>
                            <button
                                onClick={() => navigate(-1)}
                                className="mt-8 w-full py-4 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-all shadow-sm"
                            >
                                {t('Back to Setup')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-500">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">{t('Full Name')}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#191838] focus:ring-4 focus:ring-[#191838]/5 transition-all font-medium text-sm"
                                    placeholder={t('Enter your full name')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">{t('Student ID / Email Address')}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.rollNo}
                                    onChange={e => setFormData({...formData, rollNo: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#191838] focus:ring-4 focus:ring-[#191838]/5 transition-all font-medium text-sm"
                                    placeholder={t('Enter your ID or Email')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">{t('WhatsApp Number')}</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.whatsappNumber}
                                    onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#191838] focus:ring-4 focus:ring-[#191838]/5 transition-all font-medium text-sm"
                                    placeholder={t('Enter your WhatsApp number')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">{t('What is the issue?')}</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.issue}
                                        onChange={e => setFormData({...formData, issue: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#191838] focus:ring-4 focus:ring-[#191838]/5 transition-all appearance-none font-medium text-sm"
                                    >
                                        <option value="" disabled>{t('Select an issue')}</option>
                                        <option value="login">{t('Unable to login')}</option>
                                        <option value="photo">{t('Photo upload failed')}</option>
                                        <option value="password">{t('Password setup issues')}</option>
                                        <option value="other">{t('Other')}</option>
                                    </select>
                                    {/* Custom Dropdown Arrow */}
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1.5L6 6.5L11 1.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">{t('Where would you like to receive the solution?')}</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.preferredContactMethod}
                                        onChange={e => setFormData({...formData, preferredContactMethod: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#191838] focus:ring-4 focus:ring-[#191838]/5 transition-all appearance-none font-medium text-sm"
                                    >
                                        <option value="" disabled>{t('Select preferred method')}</option>
                                        <option value="WhatsApp">{t('WhatsApp')}</option>
                                        <option value="Email">{t('Email Address')}</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1.5L6 6.5L11 1.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">{t('Description')}</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#191838] focus:ring-4 focus:ring-[#191838]/5 transition-all resize-none font-medium text-sm"
                                    placeholder={t('Provide more details about the problem...')}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-6 w-full py-4 bg-[#191838] hover:bg-[#12112a] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(25,24,56,0.25)] hover:shadow-[0_6px_20px_rgba(25,24,56,0.3)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>{t('Send Request')}</span>
                                        <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetupHelpForm;
