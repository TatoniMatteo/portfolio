import './Hero.css';
import resume from '../../assets/documents/resume.pdf'
import profile_img from '../../assets/images/profile.png';
import {motion} from 'framer-motion';

const Hero = () => {
    return (
        <div className="section hero" id="home">
            <motion.img
                src={profile_img}
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
                <span>I'm Matteo Tatoni</span><br/> Software Developer
            </motion.h1>

            <motion.p
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: false, amount: 0.5}}
                transition={{duration: 0.8, delay: 0.4}}
            >
                I build reliable and scalable software solutions that deliver impactful digital experiences.
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
                    <a href={resume} download>My resume</a>
                </div>
            </motion.div>
        </div>
    )
}

export default Hero;
