import { useNavigate } from "react-router-dom";
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

    // Handles values like 0091XXXXXXXXXX
    const withoutIntlPrefix = digits.startsWith("00") ? digits.slice(2) : digits;

    // Common local format: 10-digit Indian number -> add country code
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

                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                            <Sparkles size={12} />
                            Support Desk
                        </div>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[15px] bg-[linear-gradient(145deg,#1e40af_0%,#4338ca_55%,#0f172a_100%)] text-white shadow-[0_18px_35px_-20px_rgba(30,64,175,0.75)]">
                            <LifeBuoy size={38} strokeWidth={1.6} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Let&apos;s Solve It Fast
                        </h1>
                        <p className="mt-3 max-w-lg text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
                            Reach us on WhatsApp or email and get quick help for login issues, fee queries, and student portal support.
                        </p>

                        <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-left">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                    <ShieldCheck size={16} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Trusted Help</p>
                            </div>
                            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-left">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                                    <Clock3 size={16} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Fast Response</p>
                            </div>
                            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3 text-left">
                                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                                    <Sparkles size={16} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">Personal Support</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-8 max-w-3xl space-y-4 px-5 sm:px-6">
                <div className="mb-4 flex items-center gap-2 px-1">
                    <div className="h-4 w-1 rounded-full bg-slate-300" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Contact Options
                    </h2>
                </div>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                        <MessageCircle size={22} />
                    </div>
                    <div className="flex-1">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            WhatsApp
                        </p>
                        <p className="text-base font-bold text-slate-900">{WHATSAPP_NUMBER}</p>
                        <p className="mt-1 text-xs font-semibold text-emerald-600">Tap to start instant chat</p>
                    </div>
                </a>

                <a
                    href={emailUrl}
                    className="group flex items-center gap-4 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-transform group-hover:scale-110">
                        <Mail size={22} />
                    </div>
                    <div className="flex-1">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Email
                        </p>
                        <p className="text-base font-bold text-slate-900">{SUPPORT_EMAIL}</p>
                        <p className="mt-1 text-xs font-semibold text-rose-600">For detailed support tickets</p>
                    </div>
                </a>
            </section>

            <section className="mx-auto mt-8 max-w-3xl px-5 sm:px-6">
                <div className="relative overflow-hidden rounded-[28px] border border-indigo-200 bg-[linear-gradient(130deg,#0f172a_0%,#1e1b4b_55%,#312e81_100%)] px-5 py-5 shadow-[0_20px_40px_-22px_rgba(30,27,75,0.8)] sm:px-6 sm:py-6">
                    <div className="pointer-events-none absolute -left-10 -top-8 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-fuchsia-300/30 blur-2xl" />

                    <div className="relative">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">
                            Credits
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-100">
                                    <UserCircle2 size={20} />
                                </div>
                                <p className="text-sm font-bold tracking-wide text-white/95">
                                    Developed by Rishabh Bisht
                                </p>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/20 text-amber-100">
                                    <Megaphone size={20} />
                                </div>
                                <p className="text-sm font-bold tracking-wide text-white/95">
                                    Marketing by Priyanshu Bisht , Karan Negi
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}