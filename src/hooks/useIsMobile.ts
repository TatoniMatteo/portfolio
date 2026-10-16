import {useCallback, useSyncExternalStore} from 'react';

/** Subscribe only to breakpoint changes, without delaying the responsive layout. */
export const useIsMobile = () => {
    const breakpoint = typeof window === 'undefined'
        ? '768px'
        : getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-mobile').trim() || '768px';
    const query = `(max-width: ${breakpoint})`;
    const subscribe = useCallback((onChange: () => void) => {
        const media = window.matchMedia(query);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [query]);
    const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
    return useSyncExternalStore(subscribe, getSnapshot, () => false);
};
