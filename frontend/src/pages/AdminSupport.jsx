import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogIn, ShieldAlert, KeyRound, Shield, AlertCircle } from 'lucide-react';
import AdminChat from '../components/AdminChat';
import { getBaseURL } from '../services/api';

const AdminSupport = () => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(null);
    
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if already logged in
        const storedAdmin = localStorage.getItem('adminInfo');
        const storedToken = localStorage.getItem('adminToken');
        
        if (storedAdmin && storedToken) {
            setAdmin(JSON.parse(storedAdmin));
            setToken(storedToken);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const isEmail = identifier.includes('@');
            const payload = {
                password,
                ...(isEmail ? { email: identifier } : { registrationNumber: identifier })
            };

            const response = await axios.post(`${getBaseURL()}/admin/login`, payload);

            if (response.data.token) {
                const { admin, token } = response.data;
                localStorage.setItem('adminInfo', JSON.stringify(admin));
                localStorage.setItem('adminToken', token);
                setAdmin(admin);
                setToken(token);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('adminToken');
        setAdmin(null);
        setToken(null);
    };

    if (admin && token) {
        return (
            <div className="h-screen w-screen bg-slate-100 flex flex-col font-['DM_Sans']">
                <header className="shrink-0 bg-white border-b border-slate-200 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Shield size={18} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base md:text-lg font-bold text-slate-800 leading-tight truncate">Admin Support</h1>
                            <p className="text-[11px] md:text-xs text-slate-500 font-medium truncate">Logged in as {admin.name || admin.coachingName || 'Admin'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 ml-2"
                    >
                        Sign Out
                    </button>
                </header>
                
                <main className="flex-1 overflow-hidden p-0 md:p-6">
                    <div className="h-full max-w-6xl mx-auto">
                        <AdminChat currentAdminId={admin.id} />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-['DM_Sans']">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <div className="p-8 text-center bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-600 opacity-20 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20 backdrop-blur-sm">
                            <ShieldAlert size={32} className="text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
                        <p className="text-sm text-slate-300 mt-2 font-medium">Sign in to manage student messages</p>
                    </div>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email or Reg Number</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !identifier || !password}
                            className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgb(37,99,235,0.39)]"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Sign In securely
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminSupport;
