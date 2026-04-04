import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const WelcomeModal = ({ studentName, onClose }) => {
    const { t } = useLanguage();
    const [displayedQuote, setDisplayedQuote] = useState('');
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);

    const quotes = [
        t('Success is the result of preparation and hard work.'),
        t('The future belongs to those who believe in the beauty of their dreams.'),
        t('Education is the passport to the future.'),
        t('Every expert was once a beginner.'),
        t('Your education is a dress rehearsal for a life that is yours to lead.')
    ];

    const currentQuote = quotes[quoteIndex];

    // Typewriter effect for quote
    useEffect(() => {
        if (!isTyping) return;

        if (displayedQuote.length < currentQuote.length) {
            const timer = setTimeout(() => {
                setDisplayedQuote(currentQuote.slice(0, displayedQuote.length + 1));
            }, 30);
            return () => clearTimeout(timer);
        } else {
            // Quote is fully typed, wait then trigger close
            const timer = setTimeout(() => {
                setIsTyping(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [displayedQuote, currentQuote, isTyping]);

    // Auto-close after quote animation
    useEffect(() => {
        if (!isTyping) {
            const timer = setTimeout(() => {
                onClose();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isTyping, onClose]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-screen h-screen" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 50%, #FFFFFF 100%)' }}>
            <style>{`
                @keyframes page-fade-in {
                    from { 
                        opacity: 0;
                    }
                    to { 
                        opacity: 1;
                    }
                }

                @keyframes title-slide-up {
                    0% {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes subtitle-fade-in {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes line-expand {
                    from { width: 0; }
                    to { width: 100%; }
                }

                @keyframes quote-fade-out {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(10px); }
                }

                .welcome-page {
                    animation: page-fade-in 0.8s ease-out;
                }

                .title-slide {
                    animation: title-slide-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                    animation-delay: 0.2s;
                    animation-fill-mode: both;
                }

                .subtitle-fade {
                    animation: subtitle-fade-in 0.8s ease-out;
                    animation-delay: 0.4s;
                    animation-fill-mode: both;
                }

                .accent-line {
                    animation: line-expand 1s cubic-bezier(0.34, 1.56, 0.64, 1);
                    animation-delay: 0.6s;
                    animation-fill-mode: both;
                }

                .quote-section {
                    animation: subtitle-fade-in 0.8s ease-out;
                    animation-delay: 0.8s;
                    animation-fill-mode: both;
                }

                .quote-text {
                    animation: ${!isTyping ? 'quote-fade-out 1.5s ease-out forwards' : 'none'};
                    min-height: 90px;
                }

                .cursor {
                    display: inline-block;
                    width: 3px;
                    height: 1.2em;
                    margin-left: 4px;
                    background: linear-gradient(135deg, #FFC50F, #FFD740);
                    animation: blinkCursor 0.6s infinite;
                    vertical-align: middle;
                }

                @keyframes blinkCursor {
                    0%, 49%, 100% { opacity: 1; }
                    50%, 99% { opacity: 0; }
                }

                .brand-gradient {
                    background: linear-gradient(90deg, #193466 0%, #FFC50F 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .gold-accent {
                    color: #FFC50F;
                }

                .navy-accent {
                    color: #193466;
                }

                .skip-button {
                    position: relative;
                    color: #193466;
                    font-weight: 700;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: pointer;
                }

                .skip-button:hover {
                    transform: translateY(-2px);
                    color: #FFC50F;
                }

                .skip-button:active {
                    transform: scale(0.98);
                }

                .bounce-dot {
                    background: linear-gradient(135deg, #193466, #FFC50F);
                    border-radius: 50%;
                }
            `}</style>

            {/* Main Content */}
            <div className="welcome-page flex flex-col items-center justify-center w-full h-full px-4">
                {/* Welcome Title */}
                <h1 className="title-slide text-5xl md:text-6xl font-black text-center max-w-2xl leading-tight mb-4 px-4 brand-gradient">
                    {t('Welcome to Defacto Institute')}
                </h1>

                {/* Accent Line */}
                <div className="accent-line h-1 w-24 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #FFC50F, transparent)' }}></div>

                {/* Student Name Greeting */}
                {studentName && (
                    <p className="subtitle-fade text-2xl md:text-3xl font-light text-center mt-8">
                        {t('Hello')}, <span className="gold-accent font-bold">{studentName}</span>! 👋
                    </p>
                )}

                {/* Inspirational Quote */}
                <div className="quote-section mt-16 max-w-xl px-6">
                    <p className="text-center" style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#193466', fontWeight: 500 }}>
                        <span style={{ fontSize: '2rem', color: '#FFC50F', marginRight: '4px' }}>❝</span>
                        <span className="quote-text">
                            {displayedQuote}
                            {isTyping && <span className="cursor"></span>}
                        </span>
                        <span style={{ fontSize: '2rem', color: '#FFC50F', marginLeft: '4px' }}>❞</span>
                    </p>
                </div>

                {/* Loading Indicator */}
                {isTyping && (
                    <div className="flex justify-center gap-3 mt-12">
                        <div className="bounce-dot w-3 h-3 animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="bounce-dot w-3 h-3 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="bounce-dot w-3 h-3 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                )}

                {/* Skip Button */}
                {isTyping && (
                    <button
                        onClick={onClose}
                        className="skip-button mt-12 text-lg"
                    >
                        {t('Skip')} →
                    </button>
                )}

                {/* Bottom Decorative Element */}
                <div className="absolute bottom-12 flex justify-center">
                    <div className="h-1 w-32 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #FFC50F, transparent)' }}></div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
