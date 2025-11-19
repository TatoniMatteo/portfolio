import {useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import type {IconDefinition} from "@fortawesome/fontawesome-svg-core";
import './Timeline.css';

export interface TimelineEvent {
    year: string;
    title: string;
    subtitle: string;
    description: string;
    icon: IconDefinition;
}

interface TimelineProps {
    events: TimelineEvent[];
}

const Timeline = ({ events }: TimelineProps) => {
    // Seleziona inizialmente l'ultimo elemento
    const [selected, setSelected] = useState<number>(events.length - 1);

    return (
        <div className="timeline-wrapper">
            <div className="timeline-container">
                <motion.div
                    className="timeline-line"
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ type: "spring", stiffness: 80, damping: 20 }}
                />
                {events.map((event, index) => (
                    <motion.div
                        key={"event-" + index}
                        className={`timeline-event`}
                        onClick={() => setSelected(index)}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ type: "spring", stiffness: 80, damping: 20 }}
                    >
                        <div className={`timeline-icon ${selected === index ? 'active' : ''}`}>
                            <FontAwesomeIcon icon={event.icon} size="lg" />
                        </div>
                        <div className="timeline-year">{event.year}</div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="timeline-detail-container"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8 }}
            >
                <AnimatePresence mode="wait">
                    {selected !== null && (
                        <motion.div
                            key={"event-" + selected}
                            className="timeline-detail-card"
                            initial={{opacity: 0, y: 20, scale: 0.95}}
                            animate={{opacity: 1, y: 0, scale: 1}}
                            exit={{opacity: 0, y: -20, scale: 0.95}}
                            transition={{duration: 0.5}}
                        >
                            <h2>{events[selected].title}</h2>
                            <h4>{events[selected].subtitle}</h4>
                            <h5>({events[selected].year})</h5>
                            <p>
                                {events[selected].description
                                    .split('\n')
                                    .map((line, i) => (<span key={i}>{line}<br/></span>))}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Timeline;
