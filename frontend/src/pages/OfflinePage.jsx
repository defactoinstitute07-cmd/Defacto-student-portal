import React from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const OfflinePage = () => {
    const { t } = useLanguage();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            backgroundColor: '#f5f7fa',
            fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
            padding: '24px',
            textAlign: 'center',
            boxSizing: 'border-box'
        }}>
            <div style={{
                background: '#ffffff',
                padding: '40px',
                borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '400px',
                width: '100%'
            }}>
                <div style={{
                    background: '#fef2f2',
                    padding: '20px',
                    borderRadius: '50%',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <WifiOff size={48} color="#f43f5e" />
                </div>
                <h1 style={{ 
                    margin: '0 0 12px', 
                    fontSize: '24px', 
                    fontWeight: '700',
                    color: '#111827' 
                }}>
                    {t('Connection lost')}
                </h1>
                <p style={{ 
                    margin: '0 0 32px', 
                    color: '#6b7280', 
                    fontSize: '15px', 
                    lineHeight: '1.5',
                    fontWeight: '500'
                }}>
                    {t('Please connect to your internet to continue using the application.')}
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '16px 32px',
                        background: 'linear-gradient(135deg, #191838 0%, #2d2a6e 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        boxShadow: '0 4px 16px rgba(25, 24, 56, 0.2)',
                        width: '100%'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                >
                    {t('Retry Connection')}
                </button>
            </div>
        </div>
    );
};

export default OfflinePage;
