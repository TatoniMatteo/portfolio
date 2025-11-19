import {motion} from 'framer-motion';
import type {HeroProps} from './Hero';
import './HeroMobile.css';

const HeroMobile = ({profileImg, resumeFile, name, role, description}: HeroProps) => {
    return (
        <div className="section hero-mobile" id="home">
            <motion.img
                src={profileImg}
                alt="profile image"
                initial={{opacity: 0, scale: 0.8}}
                whileInView={{opacity: 1, scale: 1}}
                viewport={{once: false, amount: 0.5}}
                transition={{duration: 0.8, ease: "easeOut"}}
            />

            <motion.h1
                initial={{opacity: 0, y: -30}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: false, amount: 0.5}}
                transition={{duration: 0.8, delay: 0.2}}
            >
                <span>{`I'm ${name}`}</span><br/> {role}
            </motion.h1>

            <motion.p
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: false, amount: 0.5}}
                transition={{duration: 0.8, delay: 0.4}}
            >
                {description}
            </motion.p>

            <motion.div
                className="hero-action"
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: false, amount: 0.5}}
                transition={{duration: 0.8, delay: 0.6}}
            >
                <div className="hero-contact">
                    <a href="#contact-me">Contact Me</a>
                </div>
                <div className="hero-resume">
                    <a href={resumeFile} download>My resume</a>
                </div>
            </motion.div>
        </div>
    );
};

export default HeroMobile;
