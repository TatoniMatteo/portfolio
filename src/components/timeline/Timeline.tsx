import {useId, useLayoutEffect, useRef, useState} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import {AnimatePresence, motion} from 'framer-motion';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import type {IconDefinition} from '@fortawesome/fontawesome-svg-core';

export interface TimelineEvent {
    year: string;
    title: string;
    subtitle: string;
    description: string;
    icon: IconDefinition;
}

interface TimelineProps { events: TimelineEvent[]; }

const Timeline = ({events}: TimelineProps) => {
    const detailId = useId();
    const {swap} = useMotionTheme();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLOListElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState(() => Math.max(0, events.length - 1));
    const selectedIndex = Math.min(selected, Math.max(0, events.length - 1));
    const selectedEvent = events[selectedIndex];

    useLayoutEffect(() => {
        const card = cardRef.current;
        const list = listRef.current;
        const wrapper = wrapperRef.current;
        if (!card || !list || !wrapper) return () => undefined;
        const syncHeight = () => {
            wrapper.style.setProperty('--timeline-card-height', `${card.getBoundingClientRect().height}px`);
            const active = list.querySelectorAll<HTMLButtonElement>('button')[selectedIndex];
            if (!active) return;
            const item = active.getBoundingClientRect();
            const bounds = list.getBoundingClientRect();
            if (item.top < bounds.top) list.scrollTop += item.top - bounds.top;
            else if (item.bottom > bounds.bottom) list.scrollTop += item.bottom - bounds.bottom;
        };
        syncHeight();
        const observer = new ResizeObserver(syncHeight);
        observer.observe(card);
        return () => observer.disconnect();
    }, [selectedIndex]);

    return (
        <div className="timeline-wrapper" ref={wrapperRef}>
            <div className="timeline-navigation">
            <ol className="timeline-container" ref={listRef}>
                {events.map((event, index) => (
                    <li key={`${event.year}-${event.title}-${index}`}>
                        <button type="button" className="timeline-event"
                            aria-label={`${event.year}: ${event.title}`}
                            aria-pressed={selectedIndex === index} aria-controls={detailId}
                            onClick={() => setSelected(index)}>
                            <span className="timeline-icon"><FontAwesomeIcon icon={event.icon}/></span>
                            <span className="timeline-event-label">
                                <span className="timeline-year">{event.year}</span>
                                <span className="timeline-event-title">{event.title}</span>
                            </span>
                        </button>
                    </li>
                ))}
            </ol>
            </div>
            <div ref={cardRef} className="timeline-detail-card" id={detailId} aria-live="polite" aria-atomic="true">
                <AnimatePresence mode="wait" initial={false}>
                    {selectedEvent && (
                        <motion.div key={selectedIndex} className="timeline-detail-content"
                            {...swap}>
                            <div className="timeline-detail-meta">
                                <span className="timeline-detail-icon"><FontAwesomeIcon icon={selectedEvent.icon}/></span>
                                <span>{selectedEvent.year}</span>
                            </div>
                            <h3>{selectedEvent.title}</h3>
                            <p className="timeline-subtitle">{selectedEvent.subtitle}</p>
                            <div className="timeline-description">
                                {selectedEvent.description.split('\n').map((line, index) => <p key={index}>{line}</p>)}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
export default Timeline;
