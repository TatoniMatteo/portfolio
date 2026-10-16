import {useEffect, useRef, useState} from 'react';
import type {RefObject} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';

export const usePDFFullscreen = (rootRef: RefObject<HTMLDivElement | null>) => {
    const {reduced, timings, easing} = useMotionTheme();
    const [fullscreen, setFullscreen] = useState(false);
    const saved = useRef<{x: number; y: number; rect: DOMRect} | null>(null);
    const pending = useRef(false);
    const wasFullscreen = useRef(false);

    useEffect(() => {
        const mountedRoot = rootRef.current;
        let animation: Animation | undefined;
        let frame = 0;
        const html = document.documentElement;
        if (mountedRoot && document.fullscreenElement === mountedRoot) html.dataset.pdfFullscreen = 'true';
        const restore = () => {
            if (saved.current) window.scrollTo({left: saved.current.x, top: saved.current.y, behavior: 'instant'});
        };
        const update = () => {
            const root = rootRef.current;
            if (!root) return;
            const active = document.fullscreenElement === root;
            if (!active && !wasFullscreen.current) return;
            animation?.cancel();
            const before = active ? saved.current?.rect : new DOMRect(0, 0, innerWidth, innerHeight);
            wasFullscreen.current = active;
            setFullscreen(active);
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (!active) {
                    restore();
                    root.querySelector<HTMLButtonElement>('.pdf-fullscreen')?.focus({preventScroll: true});
                }
                const after = root.getBoundingClientRect();
                const finish = () => {
                    root.classList.remove('is-fullscreen-transition');
                    if (!active) {
                        restore();
                        delete html.dataset.pdfFullscreen;
                        saved.current = null;
                    }
                };
                if (reduced || !before || !after.width || !after.height || !root.animate) { finish(); return; }
                root.classList.add('is-fullscreen-transition');
                animation = root.animate([
                    {transform: `translate(${before.x - after.x}px, ${before.y - after.y}px) scale(${before.width / after.width}, ${before.height / after.height})`, borderRadius: active ? '20px' : '0px'},
                    {transform: 'none', borderRadius: active ? '0px' : '20px'},
                ], {duration: timings.fullscreen * 1000, easing});
                animation.onfinish = finish;
            });
        };
        document.addEventListener('fullscreenchange', update);
        return () => {
            document.removeEventListener('fullscreenchange', update);
            cancelAnimationFrame(frame);
            animation?.cancel();
            mountedRoot?.classList.remove('is-fullscreen-transition');
            delete html.dataset.pdfFullscreen;
        };
    }, [reduced, rootRef, timings.fullscreen, easing]);

    const toggleFullscreen = async () => {
        if (pending.current) return;
        const root = rootRef.current;
        if (!root) return;
        pending.current = true;
        try {
            if (document.fullscreenElement === root) await document.exitFullscreen();
            else {
                saved.current = {x: scrollX, y: scrollY, rect: root.getBoundingClientRect()};
                document.documentElement.dataset.pdfFullscreen = 'true';
                await root.requestFullscreen();
            }
        } catch {
            if (document.fullscreenElement !== root) {
                delete document.documentElement.dataset.pdfFullscreen;
                saved.current = null;
            }
        } finally { pending.current = false; }
    };
    return {fullscreen, toggleFullscreen};
};
