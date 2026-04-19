import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import {
    MessageCircle,
    Mail,
    LifeBuoy,
    ArrowLeft,
    Sparkles,
    ShieldCheck,
    Clock3,
    UserCircle2,
    Megaphone,
    Send,
    CheckCircle2
} from "lucide-react";

const WHATSAPP_NUMBER = String(
    import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || "+917906639729"
).trim();
const SUPPORT_EMAIL = String(
    import.meta.env.VITE_SUPPORT_EMAIL || "rishabhbisht@gmail.com"
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
    
    // Form and Email Sending state
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
        <div
            style={{ fontFamily: "'Sora', 'DM Sans', 'Segoe UI', sans-serif" }}
            className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_0%,#dbeafe_0%,transparent_42%),radial-gradient(circle_at_100%_10%,#fef3c7_0%,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] text-slate-900 pb-24"
        >
            <div className="pointer-events-none absolute -top-16 -left-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 top-28 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />

            <section className="relative px-5 pt-8 sm:px-6 sm:pt-10">
                <div className="mx-auto max-w-3xl rounded-[15px] border border-white/70 bg-white/85 p-5 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur-md sm:p-8">
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center shadow-sm transition-all hover:-translate-x-0.5 hover:bg-slate-50"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div className="flex gap-3 items-center">
                            <button
                                type="button"
                                onClick={toggleLanguage}
                                className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200 shadow-sm transition-colors"
                            >
                                {language === 'en' ? 'हिंदी' : 'EN'}
                            </button>
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                                <Sparkles size={12} />
                                {t('Support Desk')}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[15px] bg-[linear-gradient(145deg,#1e40af_0%,#4338ca_55%,#0f172a_100%)] text-white shadow-[0_18px_35px_-20px_rgba(30,64,175,0.75)]">
                            <LifeBuoy size={38} strokeWidth={1.6} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            {t("Let's Solve It Fast")}
                        </h1>
                        <p className="mt-3 max-w-lg text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
                            {t("Fill out the form below or reach us on WhatsApp/Email. Get quick help for login issues, fee queries, and anything else.")}
                        </p>

                        <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-left">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                    <ShieldCheck size={16} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">{t('Trusted Help')}</p>
                            </div>
                            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-left">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                                    <Clock3 size={16} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">{t('Fast Response')}</p>
                            </div>
                            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3 text-left">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                                    <Sparkles size={16} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">{t('Personal Support')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Email Form Section using Resend */}
            <section className="mx-auto mt-8 max-w-3xl space-y-4 px-5 sm:px-6">
                <div className="mb-4 flex items-center gap-2 px-1">
                    <div className="h-4 w-1 rounded-full bg-slate-300" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {t('Direct Message')}
                    </h2>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                    {success ? (
                        <div className="py-8 text-center space-y-4 animate-in fade-in duration-500">
                            <div className="h-20 w-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('Request Submitted')}</h3>
                            <p className="text-sm text-slate-500 max-w-[280px] mx-auto font-medium">
                                {t('We have received your message. Our team will contact you soon.')}
                            </p>
                            <button
                                onClick={() => { setSuccess(false); setFormData({ name: '', rollNo: '', whatsappNumber: '', preferredContactMethod: '', issue: '', description: '' }); }}
                                className="mt-8 w-full sm:w-auto px-8 py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition-all shadow-sm"
                            >
                                {t('Send Another Message')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">{t('Full Name')}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-sm"
                                        placeholder={t('Enter your name')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">{t('Student ID / Email')}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.rollNo}
                                        onChange={e => setFormData({...formData, rollNo: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-sm"
                                        placeholder={t('ID or Email address')}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">{t('WhatsApp Number')}</label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.whatsappNumber}
                                        onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-sm"
                                        placeholder={t('Enter your WhatsApp number')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">{t('Category')}</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.issue}
                                            onChange={e => setFormData({...formData, issue: e.target.value})}
                                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all appearance-none font-medium text-sm"
                                        >
                                            <option value="" disabled>{t('Select an issue')}</option>
                                            <option value="login">{t('Login / Access Issue')}</option>
                                            <option value="fees">{t('Fee Query')}</option>
                                            <option value="attendance">{t('Attendance Record')}</option>
                                            <option value="other">{t('Other Inquiry')}</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1.5L6 6.5L11 1.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">{t('Where would you like to receive the solution?')}</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.preferredContactMethod}
                                        onChange={e => setFormData({...formData, preferredContactMethod: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all appearance-none font-medium text-sm"
                                    >
                                        <option value="" disabled>{t('Select preferred method')}</option>
                                        <option value="WhatsApp">{t('WhatsApp')}</option>
                                        <option value="Email">{t('Email Address')}</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1.5L6 6.5L11 1.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">{t('Message')}</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all resize-none font-medium text-sm"
                                    placeholder={t('Please provide details about your issue...')}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-4 w-full sm:w-auto px-8 py-3.5 bg-[linear-gradient(145deg,#1e40af_0%,#4338ca_55%,#0f172a_100%)] hover:opacity-90 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(30,64,175,0.6)] transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group ml-auto"
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

            <section className="mx-auto mt-8 max-w-3xl space-y-4 px-5 sm:px-6">
                <div className="mb-4 flex items-center gap-2 px-1">
                    <div className="h-4 w-1 rounded-full bg-slate-300" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {t('Other Options')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-start rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <div className="flex h-12 w-12 mb-4 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                            <MessageCircle size={22} />
                        </div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {t('WhatsApp')}
                        </p>
                        <p className="text-base font-bold text-slate-900">{WHATSAPP_NUMBER}</p>
                    </a>

                    <a
                        href={emailUrl}
                        className="group flex flex-col items-start rounded-3xl border border-rose-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <div className="flex h-12 w-12 mb-4 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-transform group-hover:scale-110">
                            <Mail size={22} />
                        </div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {t('Email')}
                        </p>
                        <p className="text-base font-bold text-slate-900 truncate w-[200px] sm:w-[240px]">{SUPPORT_EMAIL}</p>
                    </a>
                </div>
            </section>

            <section className="mx-auto mt-8 max-w-3xl px-5 sm:px-6">
                <div className="relative overflow-hidden rounded-[28px] border border-indigo-200 bg-[linear-gradient(130deg,#0f172a_0%,#1e1b4b_55%,#312e81_100%)] px-5 py-5 shadow-[0_20px_40px_-22px_rgba(30,27,75,0.8)] sm:px-6 sm:py-6">
                    <div className="pointer-events-none absolute -left-10 -top-8 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-fuchsia-300/30 blur-2xl" />

                    <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
                        <div className="text-center sm:text-left">
                            <p className="mb-2 sm:mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                                {t('Credits')}
                            </p>
                            <p className="text-sm font-bold tracking-wide text-white">
                                {t('Developed by Rishabh Bisht')}
                            </p>
                            <p className="text-xs font-semibold text-indigo-200 mt-1">
                                {t('Marketing by Priyanshu Bisht & Karan Negi')}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3 sm:-space-x-2 sm:space-x-0">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full sm:border-2 border-indigo-900 bg-cyan-200 flex items-center justify-center text-cyan-800 z-10"><UserCircle2 size={24}/></div>
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full sm:border-2 border-indigo-900 bg-amber-200 flex items-center justify-center text-amber-800 z-0"><Megaphone size={24} /></div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}