import {Children, useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import {useMotionTheme} from '../../hooks/useMotionTheme';

const MobilePanels = ({children, label}: {children: ReactNode; label: string}) => {
    const panels = Children.toArray(children);
    const {t} = useTranslation();
    const {reduced} = useMotionTheme();
    const trackRef = useRef<HTMLDivElement>(null);
    const selected = useRef(0);
    const [current, setCurrent] = useState(0);
    const total = panels.length;
    const moveTo = (index: number) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollTo({left: Math.max(0, Math.min(total - 1, index)) * track.clientWidth,
            behavior: reduced ? 'instant' : 'smooth'});
    };

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return () => undefined;
        const resize = () => {
            selected.current = Math.min(selected.current, total - 1);
            track.scrollTo({left: selected.current * track.clientWidth, behavior: 'instant'});
        };
        const observer = new ResizeObserver(resize);
        observer.observe(track);
        return () => observer.disconnect();
    }, [total]);

    return (
        <div className="mobile-panels">
            <div className="mobile-panels-track" ref={trackRef} role="region" aria-label={label} tabIndex={0}
                onScroll={(event) => {
                    const track = event.currentTarget;
                    const index = Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / track.clientWidth)));
                    selected.current = index;
                    setCurrent(index);
                }}
                onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault();
                    const index = event.key === 'Home' ? 0 : event.key === 'End' ? total - 1
                        : current + (event.key === 'ArrowRight' ? 1 : -1);
                    moveTo(index);
                }}>
                {panels.map((panel, index) => (
                    <div className="mobile-panel" key={index} role="group"
                        aria-label={t('panels.position', {current: index + 1, total})} tabIndex={0}>
                        {panel}
                    </div>
                ))}
            </div>
            <div className="mobile-panels-controls">
                <span className="mobile-panels-hint">{t('panels.hint')}</span>
                <button type="button" aria-label={t('panels.previous')} disabled={current === 0}
                    onClick={() => moveTo(current - 1)}>←</button>
                <span aria-live="polite" aria-atomic="true">{Math.min(current + 1, total)} / {total}</span>
                <button type="button" aria-label={t('panels.next')} disabled={current >= total - 1}
                    onClick={() => moveTo(current + 1)}>→</button>
            </div>
        </div>
    );
};

export default MobilePanels;
