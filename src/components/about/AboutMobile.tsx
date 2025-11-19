import {motion} from 'framer-motion';
import type {AboutProps} from './About';
import './AboutMobile.css';

const AboutMobile = ({skills, info, name, description}: AboutProps) => {
    const sortedInfo = [...info].sort((a, b) => a.order - b.order);

    return (
        <div className="section about-mobile" id="about-me">
            <div className="section-title">
                <h1>About Me</h1>
            </div>

            <div className="about-sections-mobile">
                <motion.div
                    className="about-left-mobile"
                    initial={{opacity: 0, x: -30}}
                    whileInView={{opacity: 1, x: 0}}
                    viewport={{once: false, amount: 0.5}}
                    transition={{duration: 0.8}}
                >
                    <motion.div
                        className="about-card-mobile"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        whileHover={{scale: 1.02}}
                        transition={{duration: 0.5}}
                    >
                        <h2>{name}</h2>
                        <div className="about-info-mobile">
                            {sortedInfo.map(({key, label, value}) => (
                                <div className="info-pair-mobile" key={key}>
                                    <span><strong>{label}</strong> <br/>{value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    <p>{description}</p>
                </motion.div>

                <div className="about-right-mobile">
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
                        >
                            {skill.type === 'svg' && skill.Component ? (
                                <skill.Component className="skill-mobile"/>
                            ) : skill.type === 'img' && skill.src ? (
                                <img className="skill-mobile" src={skill.src} alt={skill.alt}/>
                            ) : null}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutMobile;
