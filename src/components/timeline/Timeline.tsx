import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGraduationCap, faLaptopCode} from "@fortawesome/free-solid-svg-icons";
import type {IconDefinition} from "@fortawesome/fontawesome-svg-core";
import './Timeline.css';

interface TimelineEvent {
    year: string;
    title: string;
    subtitle: string;
    description: string;
    icon: IconDefinition;
}

const events: TimelineEvent[] = [
    {
        year: "2014 - 2019",
        title: "High School Diploma",
        subtitle: "Liceo Scientifico G. Galilei (Pescara) - 2014 - 2019",
        description: "High School Diploma with a score of 83/100.\nStudied mathematics, physics, chemistry, biology, Latin, and philosophy.",
        icon: faGraduationCap
    },
    {
        year: "2020 - 2023",
        title: "Bachelor in Computer Science",
        subtitle: "Università degli Studi dell'Aquila - 2019 - 2023",
        description: "Bachelor's degree in Computer Science with a score of 110/110.\nStudied programming languages, software design, algorithms, information systems, and databases.",
        icon: faGraduationCap
    },
    {
        year: "2023 - 2025",
        title: "Tirasa s.r.l.",
        subtitle: "Apprenticeship - Software Developer",
        description: "Developed custom features using Java, Spring Boot, PostgreSQL, and Linux.\nGained experience with Apache Syncope and Apereo CAS.",
        icon: faLaptopCode
    },
    {
        year: "2025 - Now",
        title: "Tirasa s.r.l.",
        subtitle: "Software Developer",
        description: "Currently working on software development and support for enterprise clients.\nTechnologies: Java, Spring Boot, PostgreSQL, Linux, Apache Syncope, Apereo CAS.",
        icon: faLaptopCode
    }
];


const Timeline = () => {
    // Seleziona inizialmente l'ultimo elemento
    const [selected, setSelected] = useState<number>(events.length - 1);

    return (
        <div className="timeline-wrapper">
            <div className="timeline-container">
                <motion.div className="timeline-line"
                            initial={{scaleX: 0, opacity: 0}}
                            whileInView={{opacity: 1, scaleX: 1}}
                            viewport={{once: false, amount: 0.3}}
                            transition={{type: "spring", stiffness: 80, damping: 20}}
                />
                {events.map((event, index) => (
                    <motion.div
                        key={"event-" + index}
                        className={`timeline-event`}
                        onClick={() => setSelected(index)}
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: false, amount: 0.3}}
                        transition={{type: "spring", stiffness: 80, damping: 20}}
                    >
                        <div className={`timeline-icon ${selected === index ? 'active' : ''}`}>
                            <FontAwesomeIcon icon={event.icon} size="lg"/>
                        </div>
                        <div className="timeline-year">{event.year}</div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="timeline-detail-container"
                initial={{opacity: 0, y: 50}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: false, amount: 0.3}}
                transition={{duration: 0.8}}
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
                            <p>{events[selected].description
                                .split('\n')
                                .map((line, i) => (<span key={i}>{line}<br/></span>))
                            }</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default Timeline;
