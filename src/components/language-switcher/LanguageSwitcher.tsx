import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LANGUAGES = [
    { code: 'en', label: 'EN' },
    { code: 'it', label: 'IT' },
] as const;

const LanguageSwitcher = () => {
    const { i18n, t } = useTranslation();
    const current = i18n.resolvedLanguage ?? 'en';

    return (
        <div className="language-switcher" role="group" aria-label={t('languageSwitcher.label')}>
            {LANGUAGES.map(({ code, label }) => (
                <button
                    key={code}
                    type="button"
                    className={`language-option ${current === code ? 'active' : ''}`}
                    onClick={() => i18n.changeLanguage(code)}
                    aria-pressed={current === code}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
