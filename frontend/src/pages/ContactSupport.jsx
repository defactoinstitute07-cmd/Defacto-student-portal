import React from 'react';
import { MessageSquare, Phone, Mail, ShieldAlert, ChevronRight, Bug, Heart } from 'lucide-react';
import StudentLayout from '../components/StudentLayout';

const ContactSupport = () => {
    return (
        <StudentLayout title="Contact & Support">
            <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/10">
                            <ShieldAlert size={40} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-3">Need Help or Found a Bug?</h1>
                            <p className="text-slate-300 font-medium text-lg lg:max-w-xl leading-relaxed">
                                We're committed to providing you with a seamless experience. If something isn't working right, or you just need assistance, we're here to help!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Instructions Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <Bug size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">How to Report an Issue</h2>
                        </div>

                        <div className="space-y-4 flex-grow">
                            <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm shrink-0">1</div>
                                <p className="text-slate-600 font-medium text-sm leading-relaxed pt-1">
                                    Take a <span className="text-blue-600 font-semibold">screenshot</span> of the issue or the bug you've encountered.
                                </p>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm shrink-0">2</div>
                                <p className="text-slate-600 font-medium text-sm leading-relaxed pt-1">
                                    Send the screenshot along with a brief description to our support team.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Primary Contact Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-center items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10 opacity-50"></div>
                        
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-6 ring-8 ring-green-50/50">
                            <MessageSquare size={32} />
                        </div>
                        <div className="mb-8">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">WhatsApp Support</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">+91 79066 39729</h3>
                        </div>
                        <a
                            href="https://wa.me/917906639729"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/25 group"
                        >
                            Chat on WhatsApp
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Additional Channels */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        Alternative Channels
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a href="tel:+917906639729" className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-100 transition-colors flex items-center gap-4 group cursor-pointer">
                            <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Call Us</p>
                                <p className="font-bold text-slate-700 mt-0.5">+91 79066 39729</p>
                            </div>
                        </a>
                        
                        <a href="mailto:rishabhbisht69@gmail.com" className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-100 transition-colors flex items-center gap-4 group cursor-pointer">
                            <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Us</p>
                                <p className="font-bold text-slate-700 mt-0.5 truncate max-w-[200px]" title="rishabhbisht69@gmail.com">rishabhbisht69@gmail.com</p>
                            </div>
                        </a>
                    </div>
                </div>
                
                {/* 🌟 ATTRACTIVE DEVELOPER BADGE 🌟 */}
                <div className="pt-8 pb-4 flex justify-center animate-in fade-in zoom-in duration-700 delay-300">
                    <div className="relative inline-flex items-center gap-2 px-6 py-3 bg-[#0f172a] rounded-full shadow-[0_0_20px_rgba(15,23,42,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-300 hover:-translate-y-1 group overflow-hidden cursor-default">
                        
                        {/* Shimmer effect inside the badge */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        
                        <p className="relative z-10 text-[13px] font-medium text-slate-300 flex items-center gap-1.5 tracking-wide">
                            Developed with 
                            <Heart size={16} className="text-red-500 fill-red-500 animate-pulse mx-0.5" /> 
                            by 
                            <span className="font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent ml-1 textsm tracking-wider">
                                RISHABH BISHT
                            </span>
                        </p>
                    </div>
                </div>
                
                {/* Inline style for the shimmer animation */}
                <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>

            </div>
        </StudentLayout>
    );
};

export default ContactSupport;