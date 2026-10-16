import {createContext, useContext} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export const STORAGE_KEY = 'portfolio-theme';

function validPreference(value: string | null): ThemePreference {
    return value === 'light' || value === 'dark' ? value : 'system';
}

export function readThemePreference(): ThemePreference {
    try { return validPreference(localStorage.getItem(STORAGE_KEY)); }
    catch { return 'system'; }
}

export function applyTheme(preference: ThemePreference) {
    const dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export const ThemeContext = createContext<{
    preference: ThemePreference;
    setPreference: (preference: ThemePreference) => void;
} | null>(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('ThemeProvider is required');
    return context;
};
