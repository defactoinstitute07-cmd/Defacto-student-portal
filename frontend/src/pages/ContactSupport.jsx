import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, UserCircle2, Megaphone, Sparkles, Code2, Rocket, Users, GraduationCap } from "lucide-react";

export default function CreditsPage() {
    const navigate = useNavigate();

    // 🌟 ENHANCED: Spring-based entrance animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 40, opacity: 0, scale: 0.9 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 120, damping: 14 }
        }
    };

    // 🌟 NEW: Floating animation for icons
    const floatingIcon = {
        animate: {
            y: [0, -8, 0],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
    };

    return (
        <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center overflow-hidden font-sans p-4 sm:p-6 lg:p-8">

            {/* --- Light Mode Ambient Glows --- */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3], rotate: [0, 90, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/40 blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3], rotate: [0, -90, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-300/40 blur-[120px] pointer-events-none"
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-5xl"
            >
                {/* Back Button */}
                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(-1)}
                    className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-blue-600 hover:shadow-md"
                    aria-label="Go back"
                >
                    <ArrowLeft size={22} strokeWidth={2.5} />
                </motion.button>

                {/* Main Glassmorphism Card */}
                <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] border border-white/60 bg-white/70 p-6 sm:p-10 lg:p-12 shadow-[0_8px_40px_rgb(0,0,0,0.04)] backdrop-blur-xl text-center">

                    {/* Decorative Elements */}
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute top-6 right-6 p-2 opacity-60"
                    >
                        <Sparkles size={32} className="text-blue-400" />
                    </motion.div>

                    {/* Header */}
                    <motion.div variants={itemVariants} className="mb-10 sm:mb-14">
                        <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 shadow-sm"
                        >
                            <Rocket size={14} /> The Team
                        </motion.span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                            Team Behind <br />
                            <motion.span
                                animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                                transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                                className="bg-[length:200%_auto] bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm"
                            >
                                Defacto Erp
                            </motion.span>
                        </h1>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 64 }}
                            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                            className="h-1.5 bg-blue-500 mx-auto rounded-full opacity-80"
                        />
                    </motion.div>

                    {/* Equal Partners Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">

                        {/* Alumni Section (Fixed Span to look perfect above or inside the grid) */}
                        <motion.div variants={itemVariants} className="md:col-span-3 flex flex-col items-center justify-center gap-1.5 border-t border-slate-200/60 pt-5 pb-2 w-full">
                            <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5 text-center leading-tight">
                                <GraduationCap size={16} className="text-slate-400" /> Alumni of Defacto Institute
                            </p>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50 shadow-sm">
                                (2020-2021)
                            </span>
                        </motion.div>

                        {/* Rishabh Bisht */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group relative flex flex-col items-center p-8 rounded-[32px] bg-white/50 border border-slate-100 hover:bg-white hover:border-blue-200 shadow-sm hover:shadow-2xl hover:shadow-blue-100/60 transition-all duration-300 h-full justify-between cursor-pointer"
                        >
                            <div className="flex flex-col items-center w-full">
                                <motion.div variants={floatingIcon} animate="animate" className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-blue-100 text-blue-600 mb-5 shadow-inner">
                                    <Code2 size={32} strokeWidth={2.5} />
                                </motion.div>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.15em] mb-2 bg-blue-50 px-3 py-1 rounded-md text-center">
                                    Full Stack Developer
                                </p>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight text-center">
                                    Rishabh Bisht
                                </h3>
                            </div>
                        </motion.div>

                        {/* Priyanshu Bisht */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group relative flex flex-col items-center p-8 rounded-[32px] bg-white/50 border border-slate-100 hover:bg-white hover:border-emerald-200 shadow-sm hover:shadow-2xl hover:shadow-emerald-100/60 transition-all duration-300 h-full cursor-pointer"
                        >
                            <div className="flex flex-col items-center w-full mt-auto mb-auto">
                                <motion.div variants={floatingIcon} animate="animate" className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-emerald-100 text-emerald-600 mb-5 shadow-inner">
                                    <Megaphone size={32} strokeWidth={2.5} />
                                </motion.div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.15em] mb-2 bg-emerald-50 px-3 py-1 rounded-md text-center">
                                    Marketing Strategy
                                </p>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight text-center">
                                    Priyanshu Bisht
                                </h3>
                            </div>
                        </motion.div>

                        {/* Karan Negi */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group relative flex flex-col items-center p-8 rounded-[32px] bg-white/50 border border-slate-100 hover:bg-white hover:border-violet-200 shadow-sm hover:shadow-2xl hover:shadow-violet-100/60 transition-all duration-300 h-full cursor-pointer"
                        >
                            <div className="flex flex-col items-center w-full mt-auto mb-auto">
                                <motion.div variants={floatingIcon} animate="animate" className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-violet-100 text-violet-600 mb-5 shadow-inner">
                                    <Users size={32} strokeWidth={2.5} />
                                </motion.div>
                                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.15em] mb-2 bg-violet-50 px-3 py-1 rounded-md text-center">
                                    Outreach Specialist
                                </p>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight text-center">
                                    Karan Negi
                                </h3>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
}