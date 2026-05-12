import React, { useState, useEffect } from 'react';

/* ─── localStorage key ─── */
const STORAGE_KEY = 'dfPermissionsPrompted';

/* ─── helpers ─── */
const requestNotifications = async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
};

const requestCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        // Release immediately — we only needed the permission grant
        stream.getTracks().forEach(t => t.stop());
        return 'granted';
    } catch (err) {
        return err.name === 'NotAllowedError' ? 'denied' : 'error';
    }
};

/* ─── component ─── */
const PermissionPrompt = () => {
    const [visible, setVisible] = useState(false);
    const [phase, setPhase] = useState('idle'); // idle | asking | done
    const [notifStatus, setNotifStatus] = useState(null);
    const [cameraStatus, setCameraStatus] = useState(null);

    useEffect(() => {
        const already = localStorage.getItem(STORAGE_KEY);
        if (!already) {
            // Small delay so the app renders first
            const t = setTimeout(() => setVisible(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const handleAllow = async () => {
        setPhase('asking');

        const [notif, camera] = await Promise.allSettled([
            requestNotifications(),
            requestCamera()
        ]);

        setNotifStatus(notif.value ?? 'error');
        setCameraStatus(camera.value ?? 'error');
        setPhase('done');
        localStorage.setItem(STORAGE_KEY, 'yes');
    };

    const handleSkip = () => {
        localStorage.setItem(STORAGE_KEY, 'skipped');
        setVisible(false);
    };

    const handleDone = () => setVisible(false);

    if (!visible) return null;

    return (
        <>
            <PpStyles />
            {/* Backdrop */}
            <div className="pp-backdrop" />

            {/* Sheet */}
            <div className="pp-sheet" role="dialog" aria-modal="true" aria-label="App permissions">

                {phase !== 'done' ? (
                    <>
                        {/* Icon cluster */}
                        <div className="pp-icons-row">
                            <div className="pp-icon-bubble pp-icon-notify">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="pp-icon-plus">+</div>
                            <div className="pp-icon-bubble pp-icon-camera">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="pp-title">Two quick permissions</h2>
                        <p className="pp-subtitle">We need these to give you the best experience.</p>

                        {/* Permission cards */}
                        <div className="pp-cards">
                            <div className="pp-card">
                                <div className="pp-card-icon pp-card-notify">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="pp-card-title">Notifications</p>
                                    <p className="pp-card-desc">Get alerts for fees, results, and class updates.</p>
                                </div>
                            </div>

                            <div className="pp-card">
                                <div className="pp-card-icon pp-card-camera">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="pp-card-title">Camera & Photos</p>
                                    <p className="pp-card-desc">Upload your profile photo during account setup.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            className="pp-allow-btn"
                            onClick={handleAllow}
                            disabled={phase === 'asking'}
                        >
                            {phase === 'asking'
                                ? <><span className="pp-spinner" /> Requesting…</>
                                : 'Allow Permissions'
                            }
                        </button>

                        <button className="pp-skip-btn" onClick={handleSkip}>
                            Not now
                        </button>
                    </>
                ) : (
                    /* ── Done screen ── */
                    <>
                        <div className="pp-done-icon">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="pp-title" style={{ marginTop: 8 }}>All set!</h2>

                        <div className="pp-result-list">
                            <StatusRow label="Notifications" status={notifStatus} />
                            <StatusRow label="Camera & Photos" status={cameraStatus} />
                        </div>

                        {(notifStatus === 'denied' || cameraStatus === 'denied') && (
                            <p className="pp-denied-hint">
                                Some permissions were denied. You can change this in your browser / phone Settings anytime.
                            </p>
                        )}

                        <button className="pp-allow-btn" onClick={handleDone}>
                            Continue to App
                        </button>
                    </>
                )}
            </div>
        </>
    );
};

/* ─── tiny helper ─── */
const StatusRow = ({ label, status }) => {
    const icon = status === 'granted'
        ? <span style={{ color: '#10b981', fontSize: 18 }}>✓</span>
        : status === 'denied'
            ? <span style={{ color: '#f43f5e', fontSize: 18 }}>✗</span>
            : <span style={{ color: '#9ca3af', fontSize: 18 }}>—</span>;

    const text = status === 'granted' ? 'Allowed' : status === 'denied' ? 'Denied' : 'Not available';
    return (
        <div className="pp-result-row">
            <span className="pp-result-label">{label}</span>
            <span className="pp-result-status">{icon} {text}</span>
        </div>
    );
};

/* ─── styles ─── */
const PpStyles = () => (
    <style>{`
        .pp-backdrop {
            position: fixed; inset: 0; z-index: 9998;
            background: rgba(15, 14, 36, 0.72);
            backdrop-filter: blur(6px);
            animation: pp-fade-in 0.3s ease both;
        }
        .pp-sheet {
            position: fixed; z-index: 9999;
            bottom: 0; left: 0; right: 0;
            background: #fff;
            border-radius: 28px 28px 0 0;
            padding: 32px 24px 40px;
            max-width: 480px;
            margin: 0 auto;
            display: flex; flex-direction: column; align-items: center;
            gap: 0;
            box-shadow: 0 -12px 60px rgba(0,0,0,0.18);
            animation: pp-slide-up 0.42s cubic-bezier(0.16,1,0.3,1) both;
            font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }

        /* Icon cluster */
        .pp-icons-row {
            display: flex; align-items: center; gap: 12px;
            margin-bottom: 20px;
        }
        .pp-icon-bubble {
            width: 56px; height: 56px; border-radius: 18px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .pp-icon-notify { background: linear-gradient(135deg,#6366f1,#818cf8); color: #fff; }
        .pp-icon-camera  { background: linear-gradient(135deg,#0ea5e9,#38bdf8); color: #fff; }
        .pp-icon-plus { font-size: 22px; font-weight: 700; color: #d1d5db; }

        /* Titles */
        .pp-title {
            font-size: 20px; font-weight: 800; color: #111827;
            margin: 0 0 6px; text-align: center; letter-spacing: -0.02em;
        }
        .pp-subtitle {
            font-size: 13px; color: #6b7280; font-weight: 500;
            margin: 0 0 20px; text-align: center;
        }

        /* Cards */
        .pp-cards { width: 100%; display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
        .pp-card {
            display: flex; align-items: center; gap: 14px;
            background: #f8fafc; border: 1.5px solid #f1f5f9;
            border-radius: 16px; padding: 14px 16px;
        }
        .pp-card-icon {
            width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
        }
        .pp-card-notify { background: #eef2ff; color: #6366f1; }
        .pp-card-camera  { background: #e0f2fe; color: #0ea5e9; }
        .pp-card-title { font-size: 14px; font-weight: 700; color: #111827; margin: 0 0 2px; }
        .pp-card-desc  { font-size: 12px; font-weight: 500; color: #6b7280; margin: 0; }

        /* Buttons */
        .pp-allow-btn {
            width: 100%; height: 52px; border: none; border-radius: 16px;
            background: linear-gradient(135deg,#191838 0%,#2d2a6e 100%);
            color: #fff; font-size: 15px; font-weight: 700;
            font-family: inherit; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            box-shadow: 0 4px 16px rgba(25,24,56,0.28);
            transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
            margin-bottom: 10px;
        }
        .pp-allow-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(25,24,56,0.32); }
        .pp-allow-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .pp-skip-btn {
            background: none; border: none; font-family: inherit;
            font-size: 13px; font-weight: 600; color: #9ca3af;
            cursor: pointer; padding: 6px 12px; border-radius: 8px;
            transition: color 0.15s;
        }
        .pp-skip-btn:hover { color: #6b7280; }

        /* Spinner */
        .pp-spinner {
            width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3);
            border-top-color: #fff; border-radius: 50%;
            animation: pp-spin 0.7s linear infinite;
        }

        /* Done screen */
        .pp-done-icon {
            width: 64px; height: 64px; border-radius: 20px;
            background: #ecfdf5; border: 1.5px solid #a7f3d0;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 4px;
            animation: pp-pop 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .pp-result-list { width: 100%; margin: 14px 0 10px; display: flex; flex-direction: column; gap: 8px; }
        .pp-result-row {
            display: flex; align-items: center; justify-content: space-between;
            background: #f8fafc; border-radius: 12px; padding: 12px 16px;
        }
        .pp-result-label { font-size: 13px; font-weight: 700; color: #374151; }
        .pp-result-status { font-size: 13px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 5px; }
        .pp-denied-hint {
            font-size: 12px; color: #9ca3af; font-weight: 500;
            text-align: center; margin: 0 0 14px; line-height: 1.5;
            background: #fef2f2; border-radius: 10px; padding: 10px 14px;
            border: 1px solid #fecaca;
        }

        /* Animations */
        @keyframes pp-fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes pp-slide-up { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        @keyframes pp-spin     { to{transform:rotate(360deg)} }
        @keyframes pp-pop      { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }

        @media (min-width: 480px) {
            .pp-sheet { bottom: 50%; transform: translateY(50%); border-radius: 28px; max-width: 420px; left:50%; right:auto; width:100%; margin-left: -210px; }
        }
    `}</style>
);

export default PermissionPrompt;
