import './Project.css';
import WaterHealth  from '../../assets/images/water-project.png';
import Portfolio  from '../../assets/images/portfolio.png';
import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

interface ProjectItem {
    title: string;
    description: string;
    image: string;
    link?: string;
}

const projects: ProjectItem[] = [
    {
        title: 'Water Health',
        description: 'Bachelor\'s thesis project: a system for interacting with a sensor for real-time water quality monitoring. Client-side project (Android app) and server-side project (Spring Boot).',
        image: WaterHealth,
        link: 'https://github.com/TatoniMatteo/Water-Project'
    },
    {
        title: 'Portfolio Website',
        description: 'A modern website created as a personal portfolio and showcase. It presents my projects, skills, and experience in a clean, organized layout. The site allows visitors to explore my work, understand my capabilities, and get a clear picture of what I can do. It focuses on functionality, clarity, and ease of navigation while reflecting my approach to software development and problem-solving.',
        image: Portfolio,
        link: 'https://github.com/TatoniMatteo/portfolio'
    },
];

const Project = () => {
    const [selected, setSelected] = useState(0);

    return (
        <div className="section" id="my-projects">
            <div className="section-title">
                <h1>My Projects</h1>
            </div>
            <div className="project-container">
                <div className="project-list">
                    {projects.map((p, index) => (
                        <motion.div
                            key={p.title}
                            className={`project-item ${selected === index ? 'active' : ''}`}
                            onClick={() => setSelected(index)}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.98}}
                            transition={{duration: 0.2}}
                        >
                            {p.title}
                        </motion.div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={projects[selected].title}
                        className="project-preview"
                        initial={{opacity: 0, x: 50}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -50}}
                        transition={{duration: 0.3}}
                    >
                        <img src={projects[selected].image} alt={projects[selected].title}/>
                        <p>{projects[selected].description}</p>
                        {projects[selected].link && (
                            <a href={projects[selected].link} target="_blank" rel="noopener noreferrer">
                                View Project
                            </a>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Project;
