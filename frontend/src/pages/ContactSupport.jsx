import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import {
    MessageCircle, Mail, LifeBuoy, ArrowLeft,
    Sparkles, ShieldCheck, Clock3, UserCircle2,
    Megaphone, Send, CheckCircle2, Copy, Check
} from "lucide-react";


const WHATSAPP_NUMBER = String(
    import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || "+91 7906639729"
).trim();
const SUPPORT_EMAIL = String(
    import.meta.env.VITE_SUPPORT_EMAIL || "[EMAIL_ADDRESS]"
).trim();

const normalizeWhatsappDigits = (rawValue) => {
    const digits = String(rawValue || "").replace(/\D/g, "");
    if (!digits) return "";
    const withoutIntlPrefix = digits.startsWith("00") ? digits.slice(2) : digits;
    if (withoutIntlPrefix.length === 10) return `91${withoutIntlPrefix}`;
    return withoutIntlPrefix;
};

const WHATSAPP_DIGITS = normalizeWhatsappDigits(WHATSAPP_NUMBER);
const FALLBACK_WHATSAPP_DIGITS = "917906639729";
const whatsappPhone = WHATSAPP_DIGITS || FALLBACK_WHATSAPP_DIGITS;

const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(
    "Hello, I need support from the student portal team."
)}`;
const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Student Portal Support Request"
)}&body=${encodeURIComponent("Hello Support Team,")}`;

export default function ContactSupport() {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useLanguage();
    const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

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
                alert("Failed to submit support request");
            }
        } catch (error) {
            console.error("API error", error);
            alert("An error occurred while sending your request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-sans selection:bg-blue-500/30 overflow-hidden">

            {/* Soft Background Glow Effects */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />

            {/* Header Section */}
            <section className="relative px-4 pt-6 sm:px-6 sm:pt-10 z-10">
                <div className="mx-auto max-w-3xl rounded-[24px] border border-white/60 bg-white/70 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl sm:p-8">

                    {/* Top Nav Bar inside card */}
                    <div className="mb-8 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center shadow-sm transition-all hover:-translate-x-1 hover:bg-slate-50 hover:text-blue-600"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </button>

                        <div className="flex gap-3 items-center">
                            <button
                                type="button"
                                onClick={toggleLanguage}
                                className="inline-flex h-9 items-center justify-center rounded-lg bg-white border border-slate-200 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-all"
                            >
                                {language === 'en' ? 'हिंदी' : 'EN'}
                            </button>
                            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600">
                                <Sparkles size={14} />
                                {t('Support Desk')}
                            </div>
                        </div>
                    </div>

                    {/* Main Hero Content */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group mb-6">
                            <div className="absolute inset-0 bg-blue-500 rounded-[20px] blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl">
                                <LifeBuoy size={36} strokeWidth={2} />
                            </div>
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl drop-shadow-sm">
                            {t("Let's Solve It Fast")}
                        </h1>
                        <p className="mt-3 max-w-lg text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
                            {t("Fill out the form below or reach us on WhatsApp/Email. Get quick help for login issues, fee queries, and anything else.")}
                        </p>

                        {/* Highlight Features */}
                        <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-left flex items-center gap-3 transition-colors hover:bg-emerald-50">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                    <ShieldCheck size={18} />
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700 leading-tight">{t('Trusted Help')}</p>
                            </div>
                            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5 text-left flex items-center gap-3 transition-colors hover:bg-sky-50">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                                    <Clock3 size={18} />
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-sky-700 leading-tight">{t('Fast Response')}</p>
                            </div>
                            <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-3.5 text-left flex items-center gap-3 transition-colors hover:bg-violet-50">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                                    <Sparkles size={18} />
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-violet-700 leading-tight">{t('Personal Support')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Email Form Section */}
            <section className="relative mx-auto mt-6 max-w-3xl space-y-4 px-4 sm:px-6 z-10">
                <div className="mb-3 flex items-center gap-2 pl-2">
                    <div className="h-4 w-1.5 rounded-full bg-blue-500" />
                    <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-500">
                        {t('Direct Message')}
                    </h2>
                </div>

                <div className="rounded-[24px] border border-slate-200/60 bg-white/80 p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
                    {success ? (
                        <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                            <div className="relative inline-flex mb-4">
                                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                <div className="relative h-20 w-20 bg-emerald-50 border-2 border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                    <CheckCircle2 size={40} strokeWidth={2.5} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('Request Submitted')}</h3>
                            <p className="text-sm text-slate-500 max-w-[280px] mx-auto font-medium">
                                {t('We have received your message. Our team will contact you soon.')}
                            </p>
                            <button
                                onClick={() => { setSuccess(false); setFormData({ name: '', rollNo: '', whatsappNumber: '', preferredContactMethod: '', issue: '', description: '' }); }}
                                className="mt-8 px-8 py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95"
                            >
                                {t('Send Another Message')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 ml-1">{t('Full Name')}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-medium text-sm placeholder:text-slate-400"
                                        placeholder={t('Enter your name')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 ml-1">{t('Student ID / Email')}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.rollNo}
                                        onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-medium text-sm placeholder:text-slate-400"
                                        placeholder={t('ID or Email address')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 ml-1">{t('WhatsApp Number')}</label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.whatsappNumber}
                                        onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all font-medium text-sm placeholder:text-slate-400"
                                        placeholder={t('Enter your WhatsApp number')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-slate-700 ml-1">{t('Category')}</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.issue}
                                            onChange={e => setFormData({ ...formData, issue: e.target.value })}
                                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all appearance-none font-medium text-sm"
                                        >
                                            <option value="" disabled>{t('Select an issue')}</option>
                                            <option value="login">{t('Login / Access Issue')}</option>
                                            <option value="fees">{t('Fee Query')}</option>
                                            <option value="attendance">{t('Attendance Record')}</option>
                                            <option value="other">{t('Other Inquiry')}</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-bold text-slate-700 ml-1">{t('Where would you like to receive the solution?')}</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.preferredContactMethod}
                                        onChange={e => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all appearance-none font-medium text-sm"
                                    >
                                        <option value="" disabled>{t('Select preferred method')}</option>
                                        <option value="WhatsApp">{t('WhatsApp')}</option>
                                        <option value="Email">{t('Email Address')}</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-bold text-slate-700 ml-1">{t('Message')}</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all resize-none font-medium text-sm placeholder:text-slate-400"
                                    placeholder={t('Please provide details about your issue...')}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)] transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group ml-auto mt-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>{t('Send Message')}</span>
                                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            {/* Alternative Contact Options */}
            <section className="relative mx-auto mt-8 max-w-3xl space-y-4 px-4 sm:px-6 z-10">
                <div className="mb-3 flex items-center gap-2 pl-2">
                    <div className="h-4 w-1.5 rounded-full bg-slate-300" />
                    <h2 className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-500">
                        {t('Other Options')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group relative flex flex-col items-start rounded-[20px] border border-emerald-100 bg-white/80 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] hover:border-emerald-200">
                        <div className="flex h-12 w-12 mb-4 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-emerald-100">
                            <MessageCircle size={24} strokeWidth={2} />
                        </div>

                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 group-hover:text-emerald-600 transition-colors">
                            {t('WhatsApp')}
                        </p>

                        <div className="flex items-center justify-between w-full mt-0.5">
                            <p className="text-base font-extrabold text-slate-800">{WHATSAPP_NUMBER}</p>

                            {/* Copy Button - Sirf yahi clickable hai */}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(WHATSAPP_NUMBER);
                                    setCopiedWhatsapp(true);
                                    setTimeout(() => setCopiedWhatsapp(false), 2000);
                                }}
                                className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer
                                    ${copiedWhatsapp
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-inner'
                                        : 'bg-white border-slate-200 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm hover:shadow'
                                    }`}
                                title={t("Copy Number")}
                            >
                                {copiedWhatsapp ? (
                                    <Check size={16} strokeWidth={2.5} className="animate-in zoom-in duration-200" />
                                ) : (
                                    <Copy size={16} strokeWidth={2} />
                                )}
                            </button>
                        </div>
                    </div>


                </div>
            </section>

            <section className="relative mx-auto mt-10 max-w-4xl px-4 sm:px-6 z-10">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-7 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">

                    {/* Glow Effects */}
                    <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />

                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">

                        {/* Left Content */}
                        <div className="text-center md:text-left">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-2">
                                Credits
                            </p>

                            <h2 className="text-xl sm:text-2xl font-bold text-white">
                                Developed by <span className="text-blue-400">Rishabh Bisht</span>
                            </h2>

                            <p className="text-sm text-slate-400 mt-2">
                                Marketing by
                                <span className="text-blue-400 font-medium"> Priyanshu Bisht </span>
                                &
                                <span className="text-blue-400 font-medium"> Karan Negi</span>
                            </p>
                        </div>

                        {/* Right Avatars */}
                        <div className="flex items-center gap-3">

                            {/* Developer */}
                            <div className="group relative">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                                    <UserCircle2 size={22} strokeWidth={2.5} />
                                </div>
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
                                    Dev
                                </span>
                            </div>

                            {/* Marketing */}
                            <div className="group relative">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                                    <Megaphone size={22} strokeWidth={2.5} />
                                </div>
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
                                    Marketing
                                </span>
                            </div>

                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}