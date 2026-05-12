import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ShieldCheck, User, ArrowRight,
    ArrowLeft, AlertCircle, Mail, Phone, Calendar, MapPin,
    BookOpen, Users, CheckCircle2, Copy, Check, Loader2
} from 'lucide-react';
import api, { saveAuthSession } from '../services/api';
import instituteLogo from '../assets/icon.png';

/* ─────────────────────────── helpers ─────────────────────────── */
const Field = ({ label, icon: Icon, error, children }) => (
    <div>
        <label className="su-label">{label}</label>
        <div className={`su-input-wrap${error ? ' su-has-error' : ''}`}>
            <Icon size={17} className="su-input-icon" />
            {children}
        </div>
        {error && <span className="su-field-error">{error}</span>}
    </div>
);

const GENDERS = ['Male', 'Female', 'Other'];

/* ─────────────────────────── component ─────────────────────────── */
const StudentSignup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [logoFailed, setLogoFailed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [generatedId, setGeneratedId] = useState('');
    const [copied, setCopied] = useState(false);

    // Dynamic options from DB
    const [options, setOptions] = useState({ batches: [], classNames: [], courses: [] });
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [customMode, setCustomMode] = useState({ className: false });

    const [form, setForm] = useState({
        name: '',
        email: '', contact: '', dob: '', gender: '',
        fatherName: '', motherName: '',
        className: '', batchId: '', session: '', address: ''
    });
    const [errors, setErrors] = useState({});

    // Fetch options once on mount
    useEffect(() => {
        setOptionsLoading(true);
        api.get('/student/signup-options')
            .then(res => { if (res.data.success) setOptions(res.data); })
            .catch(() => { /* fail silently — form still works with free-text */ })
            .finally(() => setOptionsLoading(false));
    }, []);

    const set = (key, value) => {
        setForm(p => ({ ...p, [key]: value }));
        setErrors(p => ({ ...p, [key]: '' }));
        setFormError('');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    /* ── validation ── */
    const validateStep1 = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Full name is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setFormError('');
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim() || undefined,
                contact: form.contact.trim() || undefined,
                dob: form.dob || undefined,
                gender: form.gender || undefined,
                fatherName: form.fatherName.trim() || undefined,
                motherName: form.motherName.trim() || undefined,
                className: form.className.trim() || undefined,
                session: form.session.trim() || undefined,
                address: form.address.trim() || undefined,
                batchId: form.batchId || undefined,
            };
            const res = await api.post('/student/signup', payload);
            if (res.data.success) {
                saveAuthSession({
                    token: res.data.token,
                    refreshToken: res.data.refreshToken,
                    student: res.data.student,
                    accessTokenExpiresAt: res.data.accessTokenExpiresAt
                });
                setGeneratedId(res.data.generatedStudentId || res.data.student?.rollNo || '');
                // Delay navigation so student can see & copy their ID
                setTimeout(() => navigate('/student/setup'), 8000);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            const field = err.response?.data?.field;
            if (field) {
                setErrors(p => ({ ...p, [field]: msg }));
            } else {
                setFormError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    /* ─── SUCCESS SCREEN ─── */
    if (generatedId) {
        return (
            <div className="su-page">
                <SuStyles />
                <div className="su-success-screen">
                    <div className="su-success-icon"><CheckCircle2 size={52} color="#6366f1" /></div>
                    <h2 className="su-success-title">Account Created! 🎉</h2>
                    <p className="su-success-sub">Your unique Student ID has been generated.</p>

                    <div className="su-id-card">
                        <p className="su-id-label">Your Student ID</p>
                        <div className="su-id-row">
                            <span className="su-id-value">{generatedId}</span>
                            <button type="button" className="su-copy-btn" onClick={handleCopy} aria-label="Copy Student ID">
                                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                            </button>
                        </div>
                        {copied && <p className="su-copied-hint">Copied to clipboard!</p>}
                        <p className="su-id-note">⚠️ Save this ID — you'll need it to log in.</p>
                    </div>

                    <p className="su-success-redirect">Redirecting to profile setup in a few seconds…</p>
                    <button className="su-submit su-continue-btn" onClick={() => navigate('/student/setup')}>
                        Continue to Setup <ArrowRight size={17} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="su-page">
            <SuStyles />

            {/* ── HERO ── */}
            <div className="su-hero">
                <div className="su-orb" />
                <div className="su-logo-wrap">
                    <div className="su-logo-glow" />
                    <div className="su-logo-box">
                        {logoFailed
                            ? <ShieldCheck size={38} color="#fff" />
                            : <img src={instituteLogo} alt="Logo" onError={() => setLogoFailed(true)} />
                        }
                    </div>
                </div>
                <h1 className="su-hero-title">Create Your Account</h1>
                <p className="su-hero-sub">Join the De Facto Student Portal</p>

                {/* Step indicator */}
                <div className="su-steps">
                    <div className={`su-step${step >= 1 ? ' active' : ''}`}>
                        <span className="su-step-num">1</span>
                        <span className="su-step-label">Account</span>
                    </div>
                    <div className={`su-step-line${step >= 2 ? ' active' : ''}`} />
                    <div className={`su-step${step >= 2 ? ' active' : ''}`}>
                        <span className="su-step-num">2</span>
                        <span className="su-step-label">Details</span>
                    </div>
                </div>
            </div>

            {/* ── CARD ── */}
            <div className="su-card">

                {/* Error banner */}
                {formError && (
                    <div className="su-error" role="alert">
                        <AlertCircle size={17} className="su-error-icon" />
                        <p className="su-error-text">{formError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="su-form" noValidate>

                    {/* ════ STEP 1 ════ */}
                    {step === 1 && (
                        <>
                            <p className="su-step-heading">Your Account</p>
                            <p className="su-step-hint">Just enter your name — we'll generate your Student ID automatically. You'll set a password in the next step.</p>

                            <Field label="Full Name *" icon={User} error={errors.name}>
                                <input
                                    id="su-name"
                                    className={`su-input${errors.name ? ' su-input-error' : ''}`}
                                    type="text"
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                />
                            </Field>

                            <button type="button" className="su-submit" onClick={handleNext}>
                                <span>Continue</span>
                                <ArrowRight size={18} className="su-btn-arrow" />
                            </button>
                        </>
                    )}

                    {/* ════ STEP 2 ════ */}
                    {step === 2 && (
                        <>
                            <p className="su-step-heading">Personal Details <span className="su-optional"></span></p>

                            <div className="su-grid-2">
                                <Field label="Email Address" icon={Mail} error={errors.email}>
                                    <input
                                        id="su-email"
                                        className={`su-input${errors.email ? ' su-input-error' : ''}`}
                                        type="email"
                                        value={form.email}
                                        onChange={e => set('email', e.target.value)}
                                        placeholder="your@email.com"
                                        autoComplete="email"
                                    />
                                </Field>

                                <Field label="Contact (Phone)" icon={Phone} error={errors.contact}>
                                    <input
                                        id="su-contact"
                                        className="su-input"
                                        type="tel"
                                        value={form.contact}
                                        onChange={e => set('contact', e.target.value)}
                                        placeholder="Phone number"
                                    />
                                </Field>

                                <Field label="Date of Birth" icon={Calendar} error={errors.dob}>
                                    <input
                                        id="su-dob"
                                        className="su-input"
                                        type="date"
                                        value={form.dob}
                                        onChange={e => set('dob', e.target.value)}
                                    />
                                </Field>

                                <Field label="Gender" icon={Users} error={errors.gender}>
                                    <select
                                        id="su-gender"
                                        className="su-input su-select"
                                        value={form.gender}
                                        onChange={e => set('gender', e.target.value)}
                                    >
                                        <option value="">Select gender</option>
                                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </Field>

                                <Field label="Father's Name" icon={User} error={errors.fatherName}>
                                    <input
                                        id="su-father"
                                        className="su-input"
                                        type="text"
                                        value={form.fatherName}
                                        onChange={e => set('fatherName', e.target.value)}
                                        placeholder="Father's full name"
                                    />
                                </Field>

                                <Field label="Mother's Name" icon={User} error={errors.motherName}>
                                    <input
                                        id="su-mother"
                                        className="su-input"
                                        type="text"
                                        value={form.motherName}
                                        onChange={e => set('motherName', e.target.value)}
                                        placeholder="Mother's full name"
                                    />
                                </Field>

                                {/* ── Class / Course (dynamic dropdown) ── */}
                                <Field label="Class / Course" icon={BookOpen} error={errors.className}>
                                    {options.classNames.length > 0 && !customMode.className ? (
                                        <select
                                            id="su-class"
                                            className="su-input su-select"
                                            value={form.className}
                                            onChange={e => {
                                                if (e.target.value === '__other__') {
                                                    setCustomMode(p => ({ ...p, className: true }));
                                                    set('className', '');
                                                } else {
                                                    set('className', e.target.value);
                                                }
                                            }}
                                        >
                                            <option value="">Select class / course</option>
                                            {options.classNames.map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="__other__">Other (type your own)</option>
                                        </select>
                                    ) : (
                                        <input
                                            id="su-class"
                                            className="su-input"
                                            type="text"
                                            value={form.className}
                                            onChange={e => set('className', e.target.value)}
                                            placeholder="e.g. Class 12, B.Sc."
                                        />
                                    )}
                                </Field>

                                {/* ── Batch (dynamic dropdown) ── */}
                                <Field label="Batch" icon={Users} error={errors.batchId}>
                                    {optionsLoading ? (
                                        <div className="su-input su-loading-field">
                                            <Loader2 size={15} className="su-spin-icon" /> Loading batches…
                                        </div>
                                    ) : options.batches.length > 0 ? (
                                        <select
                                            id="su-batch"
                                            className="su-input su-select"
                                            value={form.batchId}
                                            onChange={e => set('batchId', e.target.value)}
                                        >
                                            <option value="">Select batch</option>
                                            {options.batches.map(b => (
                                                <option key={b._id} value={b._id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            id="su-batch"
                                            className="su-input"
                                            type="text"
                                            disabled
                                            placeholder="No batches available yet"
                                        />
                                    )}
                                </Field>

                                {/* ── Academic Session ── */}
                                <Field label="Academic Session" icon={Calendar} error={errors.session}>
                                    <input
                                        id="su-session"
                                        className="su-input"
                                        type="text"
                                        value={form.session}
                                        onChange={e => set('session', e.target.value)}
                                        placeholder="e.g. 2025-2026"
                                    />
                                </Field>
                            </div>

                            <Field label="Address" icon={MapPin} error={errors.address}>
                                <textarea
                                    id="su-address"
                                    className="su-input su-textarea"
                                    value={form.address}
                                    onChange={e => set('address', e.target.value)}
                                    placeholder="Your residential address"
                                    rows={2}
                                />
                            </Field>

                            <div className="su-action-row">
                                <button type="button" className="su-back-btn" onClick={() => setStep(1)}>
                                    <ArrowLeft size={17} /> Back
                                </button>
                                <button type="submit" className="su-submit su-submit-flex" disabled={loading} aria-busy={loading}>
                                    {loading
                                        ? <><div className="su-spinner" /><span>Creating…</span></>
                                        : <><span>Create Account</span><ArrowRight size={18} className="su-btn-arrow" /></>
                                    }
                                </button>
                            </div>
                        </>
                    )}
                </form>

                {/* Sign-in link */}
                <div className="su-footer">
                    <span className="su-footer-text">Already have an account?</span>
                    <Link to="/student/login" className="su-footer-link">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────── styles ─────────────────────────── */
const SuStyles = () => (
    <style>{`
        .su-page {
            display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh;
            font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
            background: #f5f7fa; overflow-x: hidden;
        }
        .su-hero {
            position: relative; flex-shrink: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 44px 24px 80px;
            background: linear-gradient(165deg, #1e1b4b 0%, #191838 35%, #0f0e24 100%);
            overflow: hidden;
        }
        .su-hero::before {
            content: ''; position: absolute; inset: 0;
            background-image: linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),
                linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);
            background-size: 40px 40px; pointer-events: none;
        }
        .su-orb {
            position: absolute; width: 260px; height: 260px; border-radius: 50%;
            background: radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%);
            top: -60px; right: -80px; pointer-events: none;
        }
        .su-logo-wrap { position: relative; margin-bottom: 16px; }
        .su-logo-glow {
            position: absolute; inset: -14px; border-radius: 24px;
            background: radial-gradient(circle,rgba(99,102,241,0.28) 0%,transparent 70%);
            animation: su-glow 3s ease-in-out infinite; pointer-events: none;
        }
        .su-logo-box {
            position: relative; width: 72px; height: 72px; border-radius: 20px;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(12px); display: flex; align-items: center;
            justify-content: center; padding: 9px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .su-logo-box img { width: 100%; height: 100%; object-fit: contain; }
        .su-hero-title {
            color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;
            margin: 0 0 6px; text-align: center;
        }
        .su-hero-sub {
            color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500;
            margin: 0 0 24px; text-align: center;
        }
        /* Step indicator */
        .su-steps { display: flex; align-items: center; gap: 0; }
        .su-step {
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            opacity: 0.45; transition: opacity 0.3s;
        }
        .su-step.active { opacity: 1; }
        .su-step-num {
            width: 30px; height: 30px; border-radius: 50%;
            background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.25);
            color: #fff; font-size: 13px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.3s, border-color 0.3s;
        }
        .su-step.active .su-step-num {
            background: #6366f1; border-color: #6366f1;
        }
        .su-step-label { color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 600; }
        .su-step-line {
            width: 48px; height: 1.5px; background: rgba(255,255,255,0.2);
            margin: 0 4px; margin-bottom: 18px; transition: background 0.3s;
        }
        .su-step-line.active { background: #6366f1; }

        /* Card */
        .su-card {
            position: relative; flex: 1; margin-top: -36px;
            background: #fff; border-radius: 32px 32px 0 0;
            padding: 32px 24px 40px;
            box-shadow: 0 -8px 40px rgba(0,0,0,0.08);
            animation: su-slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        @media (min-width: 480px) { .su-card { padding: 36px 32px 48px; } }

        /* Error */
        .su-error {
            display: flex; align-items: flex-start; gap: 10px;
            padding: 12px 14px; background: #fef2f2; border: 1px solid #fecaca;
            border-radius: 14px; margin-bottom: 20px;
        }
        .su-error-icon { color: #f43f5e; flex-shrink: 0; margin-top: 2px; }
        .su-error-text { font-size: 13px; font-weight: 600; color: #be123c; margin: 0; }

        /* Form */
        .su-form { display: flex; flex-direction: column; gap: 16px; }
        .su-step-heading {
            font-size: 16px; font-weight: 800; color: #111827;
            margin: 0 0 4px; letter-spacing: -0.02em;
        }
        .su-step-hint {
            font-size: 12.5px; color: #6b7280; font-weight: 500;
            margin: 0 0 6px; line-height: 1.5;
        }
        .su-optional { font-size: 12px; font-weight: 500; color: #9ca3af; }
        .su-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 480px) { .su-grid-2 { grid-template-columns: 1fr; } }

        .su-label {
            display: block; font-size: 12px; font-weight: 700; color: #374151;
            margin-bottom: 6px; letter-spacing: -0.01em;
        }
        .su-input-wrap {
            position: relative; display: flex; align-items: center;
        }
        .su-input-icon {
            position: absolute; left: 14px; color: #9ca3af;
            pointer-events: none; transition: color 0.2s; z-index: 2;
        }
        .su-input-wrap:focus-within .su-input-icon { color: #191838; }
        .su-input-wrap.su-has-error .su-input-icon { color: #f43f5e; }
        .su-input {
            width: 100%; height: 46px; padding: 0 14px 0 42px;
            background: #f8fafc; border: 1.5px solid #e5e7eb;
            border-radius: 14px; font-size: 14px; font-weight: 500;
            font-family: inherit; color: #111827; outline: none;
            transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .su-input::placeholder { color: #9ca3af; font-weight: 400; }
        .su-input:focus {
            border-color: #191838; background: #fff;
            box-shadow: 0 0 0 3px rgba(25,24,56,0.06);
        }
        .su-input.su-input-error { border-color: #fca5a5; }
        .su-input.su-input-error:focus { border-color: #f43f5e; box-shadow: 0 0 0 3px rgba(244,63,94,0.08); }
        .su-input-pw { padding-right: 44px; }
        .su-select { appearance: none; cursor: pointer; }
        .su-textarea {
            height: auto; padding-top: 12px; padding-bottom: 12px;
            resize: none; line-height: 1.5;
        }
        .su-loading-field {
            display: flex; align-items: center; gap: 8px;
            color: #9ca3af; font-size: 13px; font-weight: 500;
            pointer-events: none;
        }
        .su-spin-icon { animation: su-spin 0.8s linear infinite; flex-shrink: 0; }

        .su-eye-btn {
            position: absolute; right: 12px; background: none; border: none;
            color: #9ca3af; cursor: pointer; display: flex; align-items: center;
            padding: 4px; border-radius: 8px; transition: all 0.15s; z-index: 2;
        }
        .su-eye-btn:hover { color: #191838; }
        .su-field-error {
            display: block; font-size: 11px; font-weight: 600;
            color: #f43f5e; margin-top: 5px; padding-left: 2px;
        }

        /* Buttons */
        .su-submit {
            width: 100%; height: 50px; border: none; border-radius: 16px;
            background: linear-gradient(135deg,#191838 0%,#2d2a6e 100%);
            color: #fff; font-size: 15px; font-weight: 700; font-family: inherit;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; gap: 8px; position: relative; overflow: hidden;
            transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
            box-shadow: 0 4px 16px rgba(25,24,56,0.28);
        }
        .su-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(25,24,56,0.32); }
        .su-submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .su-submit-flex { flex: 1; }
        .su-btn-arrow { transition: transform 0.2s; }
        .su-submit:hover:not(:disabled) .su-btn-arrow { transform: translateX(4px); }
        .su-action-row { display: flex; gap: 12px; align-items: stretch; }
        .su-back-btn {
            display: flex; align-items: center; gap: 6px;
            padding: 0 20px; height: 50px; border: 1.5px solid #e5e7eb;
            border-radius: 16px; background: transparent; color: #64748b;
            font-size: 14px; font-weight: 700; font-family: inherit;
            cursor: pointer; transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
            flex-shrink: 0;
        }
        .su-back-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        .su-spinner {
            width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.25);
            border-top-color: #fff; border-radius: 50%; animation: su-spin 0.7s linear infinite;
        }

        /* Footer */
        .su-footer {
            display: flex; align-items: center; justify-content: center;
            gap: 6px; margin-top: 24px; padding-top: 20px;
            border-top: 1px solid #f1f5f9;
        }
        .su-footer-text { font-size: 13px; color: #9ca3af; font-weight: 500; }
        .su-footer-link {
            font-size: 13px; font-weight: 700; color: #191838;
            text-decoration: none; transition: color 0.15s;
        }
        .su-footer-link:hover { color: #6366f1; text-decoration: underline; }

        /* Success screen */
        .su-success-screen {
            flex: 1; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 12px; padding: 40px;
        }
        .su-success-icon { animation: su-pop 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .su-success-title { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
        .su-success-sub { font-size: 14px; color: #6b7280; margin: 0; }

        /* Generated ID card */
        .su-id-card {
            width: 100%; max-width: 340px;
            background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
            border: 1.5px solid #c7d2fe; border-radius: 20px;
            padding: 20px 22px; text-align: center;
            animation: su-pop 0.4s cubic-bezier(0.16,1,0.3,1) 0.15s both;
        }
        .su-id-label {
            font-size: 11px; font-weight: 700; color: #6366f1;
            text-transform: uppercase; letter-spacing: 0.07em; margin: 0 0 10px;
        }
        .su-id-row {
            display: flex; align-items: center; justify-content: center;
            gap: 10px; margin-bottom: 6px;
        }
        .su-id-value {
            font-size: 22px; font-weight: 800; color: #1e1b4b;
            letter-spacing: 0.04em; font-family: 'DM Mono', 'Fira Code', monospace;
        }
        .su-copy-btn {
            display: flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; border-radius: 10px;
            border: 1.5px solid #a5b4fc; background: #fff;
            color: #6366f1; cursor: pointer;
            transition: all 0.15s cubic-bezier(0.16,1,0.3,1);
        }
        .su-copy-btn:hover { background: #6366f1; color: #fff; border-color: #6366f1; transform: scale(1.08); }
        .su-copied-hint { font-size: 11px; font-weight: 700; color: #10b981; margin: 0 0 4px; }
        .su-id-note {
            font-size: 12px; font-weight: 600; color: #6366f1; margin: 8px 0 0;
            background: rgba(99,102,241,0.08); border-radius: 8px; padding: 6px 10px;
        }
        .su-success-redirect { font-size: 12px; color: #9ca3af; margin: 4px 0 0; }
        .su-continue-btn { max-width: 220px; height: 46px; font-size: 14px; }


        /* Animations */
        @keyframes su-slide-up { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes su-glow { 0%,100%{opacity:.5;transform:scale(1);} 50%{opacity:1;transform:scale(1.07);} }
        @keyframes su-spin { to { transform: rotate(360deg); } }
        @keyframes su-pop { from{opacity:0;transform:scale(0.6);} to{opacity:1;transform:scale(1);} }
    `}</style>
);

export default StudentSignup;
