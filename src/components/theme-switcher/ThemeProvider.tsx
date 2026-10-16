import {useLayoutEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {ThemeContext, STORAGE_KEY, readThemePreference, applyTheme} from './theme';
import type {ThemePreference} from './theme';

export const ThemeProvider = ({children}: PropsWithChildren) => {
    const [preference, setPreferenceState] = useState(readThemePreference);
    const setPreference = (next: ThemePreference) => {
        try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Keep working without persistent storage. */ }
        setPreferenceState(next);
    };

    useLayoutEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const update = () => applyTheme(preference);
        update();
        media.addEventListener('change', update);
        const sync = (event: StorageEvent) => {
            if (event.key === STORAGE_KEY || event.key === null) setPreferenceState(readThemePreference());
        };
        window.addEventListener('storage', sync);
        return () => {
            media.removeEventListener('change', update);
            window.removeEventListener('storage', sync);
        };
    }, [preference]);

    return <ThemeContext.Provider value={{preference, setPreference}}>{children}</ThemeContext.Provider>;
};
