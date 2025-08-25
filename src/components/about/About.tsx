import './About.css';
import {motion} from 'framer-motion';
import Java from '../../assets/images/java.svg?react';
import Spring from '../../assets/images/spring.svg?react';
import PGSQL from '../../assets/images/pgsql.svg?react';
import HTML from '../../assets/images/HTML.svg?react';
import CSS from '../../assets/images/CSS.svg?react';
import Linux from '../../assets/images/linux.svg?react';
import Syncope from '../../assets/images/syncope.jpg';
import CAS from '../../assets/images/cas.svg?react';
import * as React from "react";

interface Skill {
    Component?: React.ComponentType<any>;
    alt?: string;
    src?: string;
    type: 'svg' | 'img';
}

const skills: Skill[] = [
    {type: 'svg', Component: Java},
    {type: 'svg', Component: Spring},
    {type: 'svg', Component: PGSQL},
    {type: 'svg', Component: HTML},
    {type: 'svg', Component: CSS},
    {type: 'svg', Component: Linux},
    {type: 'img', src: Syncope, alt: 'Syncope'},
    {type: 'svg', Component: CAS},
];

const About = () => {
    const birthDate = new Date('2001-05-17');

    const calculateAge = (dob: Date) => {
        const diff = new Date().getTime() - dob.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const info = [
        {key: 'age', label: 'Age', value: calculateAge(birthDate), order: 1},
        {key: 'residence', label: 'Residence', value: 'Spoltore, Pescara - Italy', order: 2},
        {key: 'gender', label: 'Gender', value: 'M', order: 3},
        {key: 'profession', label: 'Profession', value: 'Software Developer', order: 4}
    ];

    const sortedInfo = info.sort((a, b) => a.order - b.order);

    return (
        <div className="section" id="about-me">
            <div className="section-title">
                <h1>About Me</h1>
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
                        <h2>Matteo Tatoni</h2>
                        <div className="about-info">
                            {sortedInfo.map(({key, label, value}) => (
                                <div className="info-pair" key={key}>
                                    <span><strong>{label}</strong> <br/>{value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    <p>
                        I am a software developer with experience using Open Source technologies.
                        I mainly work with <span className="enhance">Java</span>, <span
                        className="enhance">Spring Boot</span>, <span className="enhance">PostgreSQL</span>, and <span
                        className="enhance">Linux</span> systems,
                        and I integrate tools like <span className="enhance">Apache Syncope</span> and <span
                        className="enhance">Apereo CAS</span> for identity and authentication management.
                        As part of my work, I analyze the products I use and make small contributions to improve their
                        features, stability, and integration in client projects.
                        This has helped me better understand complex system architectures and the development processes
                        needed to manage real-world applications.
                    </p>
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
                        >
                            {skill.type === 'svg' && skill.Component ? (
                                <skill.Component className="skill"/>
                            ) : skill.type === 'img' && skill.src ? (
                                <img className="skill" src={skill.src} alt={skill.alt}/>
                            ) : null}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default About;
