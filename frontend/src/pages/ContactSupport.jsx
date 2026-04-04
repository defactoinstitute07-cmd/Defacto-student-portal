import { useNavigate } from "react-router-dom";
import {
    MessageCircle,
    Mail,
    LifeBuoy,
    Heart,
    ArrowLeft,
} from "lucide-react";

const WHATSAPP_NUMBER = String(
    import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || "+917906639729"
).trim();
const SUPPORT_EMAIL = String(
    import.meta.env.VITE_SUPPORT_EMAIL || "rishabhbisht@gmail.com"
).trim();
const WHATSAPP_DIGITS = WHATSAPP_NUMBER.replace(/\D/g, "");

const whatsappUrl = `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(
    "Hello, I need support from the student portal team."
)}`;
const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Student Portal Support Request"
)}&body=${encodeURIComponent("Hello Support Team,")}`;

export default function ContactSupport() {
    const navigate = useNavigate();

    return (
        <div
            style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
            className="bg-[#f4f5f9] min-h-screen text-slate-900 pb-24"
        >
            {/* Hero */}
            <section className="bg-white px-6 pt-12 pb-10 rounded-b-[40px] shadow-sm">
                <div className="max-w-lg mx-auto flex flex-col items-center text-center">
                    <div className="w-full flex justify-start mb-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="h-10 w-10 rounded-[15px] border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    </div>
                    <div
                        className="w-20 h-20 rounded-[15px] flex items-center justify-center mb-6 transition-colors duration-500"
                        style={{ background: "#1a1b4b18" }}
                    >
                        <LifeBuoy
                            size={38}
                            strokeWidth={1.5}
                            style={{ color: "#1a1b4b" }}
                        />
                    </div>
                    <h1 className="text-3xl font-black text-[#1a1b4b] mb-2 tracking-tight leading-tight">
                        How can we help?
                    </h1>
                    <p className="text-slate-400 font-medium max-w-[260px] leading-relaxed text-sm">
                        Contact us directly on WhatsApp or Email.
                    </p>
                </div>
            </section>

            <section className="max-w-2xl mx-auto px-5 mt-8 space-y-4">
                <div className="flex items-center gap-2 px-1 mb-4">
                    <div className="w-1 h-4 rounded-[15px] bg-slate-300" />
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Contact Options
                    </h2>
                </div>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-6 rounded-[15px] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[15px] flex items-center justify-center">
                        <MessageCircle size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            WhatsApp
                        </p>
                        <p className="text-base font-bold text-[#1a1b4b]">{WHATSAPP_NUMBER}</p>
                    </div>
                </a>

                <a
                    href={emailUrl}
                    className="bg-white p-6 rounded-[15px] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-[15px] flex items-center justify-center">
                        <Mail size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Email
                        </p>
                        <p className="text-base font-bold text-[#1a1b4b]">{SUPPORT_EMAIL}</p>
                    </div>
                </a>
            </section>

            <section className="max-w-2xl mx-auto px-5 mt-8">
                <div className="relative overflow-hidden rounded-[15px] border border-[#1a1b4b]/10 bg-[#1a1b4b] px-5 py-4 shadow-[0_12px_30px_rgba(26,27,75,0.25)]">
                    <div className="pointer-events-none absolute -top-8 -left-8 h-20 w-20 rounded-full bg-cyan-300/25 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-pink-300/25 blur-2xl" />

                    <div className="relative flex items-center justify-center gap-2 text-center">

                        <p className="text-sm font-bold tracking-wide text-white/90" style={{ animation: "textShimmer 3.8s linear infinite" }}>
                          -  Developed by Rishabh Bisht
                        </p>
                    </div>
                </div>
            </section>

            <style>{`
                @keyframes pulseHeart {
                    0%, 100% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.2); opacity: 1; }
                }

                @keyframes textShimmer {
                    0% { text-shadow: 0 0 0 rgba(255,255,255,0.15); }
                    50% { text-shadow: 0 0 14px rgba(255,255,255,0.5); }
                    100% { text-shadow: 0 0 0 rgba(255,255,255,0.15); }
                }
            `}</style>
        </div>
    );
}