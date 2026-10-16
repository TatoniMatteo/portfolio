import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSun, faMoon, faDesktop} from '@fortawesome/free-solid-svg-icons';
import {useTranslation} from 'react-i18next';
import {useTheme} from './theme';
import type {ThemePreference} from './theme';

const modes: ThemePreference[] = ['system', 'light', 'dark'];
const icons = {light: faSun, dark: faMoon, system: faDesktop};

const ThemeSwitcher = () => {
    const {t} = useTranslation();
    const {preference, setPreference} = useTheme();
    const next = modes[(modes.indexOf(preference) + 1) % modes.length];
    const label = t('themeSwitcher.action', {current: t(`themeSwitcher.${preference}`), next: t(`themeSwitcher.${next}`)});
    return <button type="button" className="theme-switcher" aria-label={label} title={label}
        onClick={() => setPreference(next)}>
        <FontAwesomeIcon icon={icons[preference]}/>
    </button>;
};
export default ThemeSwitcher;
