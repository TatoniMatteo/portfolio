import { useEffect, useState } from 'react';
import HeroDesktop from './HeroDesktop';
import HeroMobile from './HeroMobile';
import profile_img from '../../assets/images/profile.jpeg';
import resume from '../../assets/documents/CV-Matteo-Tatoni.pdf';
import './Hero.css';

export type HeroProps = {
    profileImg: string;
    resumeFile: string;
    name: string;
    role: string;
    description: string;
};

const Hero = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const props: HeroProps = {
        profileImg: profile_img,
        resumeFile: resume,
        name: "Matteo Tatoni",
        role: "Software Developer",
        description: "I build reliable and scalable software solutions that deliver impactful digital experiences."
    };

    return isMobile ? <HeroMobile {...props} /> : <HeroDesktop {...props} />;
};

export default Hero;
