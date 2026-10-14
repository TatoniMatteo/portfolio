import {motion} from 'framer-motion';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import type {AboutProps} from './About';
import './AboutDesktop.css';

const AboutDesktop = ({skills, info, name, description, title}: AboutProps) => {
    const sortedInfo = [...info].sort((a, b) => a.order - b.order);

    return (
        <div className="section about-desktop" id="about-me">
            <div className="section-title">
                <h1>{title}</h1>
            </div>

            <div className="about-sections">
                <motion.div
                    className="about-left"
                    initial={{opacity: 0, x: -50}}
                    whileInView={{opacity: 1, x: 0}}
                    viewport={{once: false, amount: 0.5}}
                    transition={{duration: 0.8}}
                >
                    <motion.div
                        className="about-card"
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        whileHover={{scale: 1.05}}
                        transition={{duration: 0.5}}
                    >
                        <h2>{name}</h2>
                        <div className="about-info">
                            {sortedInfo.map(({key, label, value}) => (
                                <div className="info-pair" key={key}>
                                    <span><strong>{label}</strong> <br/>{value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    <p>{description}</p>
                </motion.div>

                <div className="about-right">
                    {skills.map((skill, index) => (
                        <motion.div
                            key={index}
                            initial={{opacity: 0, scale: 0.8, rotate: 0}}
                            whileInView={{opacity: 1, scale: 1}}
                            viewport={{once: false, amount: 0.5}}
                            transition={{type: "spring", stiffness: 30, damping: 10}}
                            whileHover={{
                                scale: 1.2,
                                rotate: [0, 8, -8, 4, -4, 0],
                                transition: {
                                    type: "tween",
                                    duration: 0.6,
                                    repeat: 1,
                                    repeatType: "mirror",
                                    ease: "easeInOut"
                                }
                            }}
                            style={{display: 'inline-block', cursor: 'pointer'}}
                            title={skill.label}
                        >
                            {skill.type === 'svg' && skill.Component ? (
                                <skill.Component className="skill" aria-label={skill.label}/>
                            ) : skill.type === 'img' && skill.src ? (
                                <img className="skill" src={skill.src} alt={skill.alt ?? skill.label}/>
                            ) : skill.type === 'fa' && skill.faIcon ? (
                                <FontAwesomeIcon className="skill" icon={skill.faIcon} aria-label={skill.label}/>
                            ) : null}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutDesktop;
