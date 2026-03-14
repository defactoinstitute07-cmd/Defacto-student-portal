import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggleButton = ({ variant = 'topbar', className = '' }) => {
    const { language, toggleLanguage, t } = useLanguage();

    const baseClasses = 'flex items-center gap-2 rounded-md bg-gray-900 text-white border border-white/10 active:scale-[0.98] transition-transform';
    const variantClasses = variant === 'floating'
        ? 'fixed right-4 bottom-24 md:bottom-6 z-[120] px-4 py-3 shadow-xl shadow-gray-900/20'
        : 'px-3 py-2 shadow-sm';

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            className={`${baseClasses} ${variantClasses} ${className}`.trim()}
            aria-label={t('Switch language')}
            title={t('Switch language')}
        >
            <Languages size={16} />
            <span className="text-[11px] font-black uppercase tracking-[0.22em]">
                {language === 'en' ? 'हिंदी' : 'English'}
            </span>
        </button>
    );
};

export default LanguageToggleButton;
