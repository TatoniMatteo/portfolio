import AboutDesktop from './AboutDesktop';
import AboutMobile from './AboutMobile';
import Java from '../../assets/images/java.svg?react';
import Spring from '../../assets/images/spring.svg?react';
import PGSQL from '../../assets/images/pgsql.svg?react';
import HTML from '../../assets/images/HTML.svg?react';
import CSS from '../../assets/images/CSS.svg?react';
import Linux from '../../assets/images/linux.svg?react';
import Syncope from '../../assets/images/syncope.jpg';
import CAS from '../../assets/images/cas.svg?react';
import * as React from "react";
import './About.css'

interface Skill {
    Component?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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

export interface InfoItem {
    key: string;
    label: string;
    value: string | number;
    order: number;
}

export interface AboutProps {
    skills: Skill[];
    info: InfoItem[];
    name: string;
    description: string;
}

const About = () => {

    const birthDate = new Date('2001-05-17');
    const calculateAge = (dob: Date) => {
        const diff = new Date().getTime() - dob.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const info: InfoItem[] = [
        {key: 'age', label: 'Age', value: calculateAge(birthDate), order: 1},
        {key: 'residence', label: 'Residence', value: 'Spoltore, Pescara - Italy', order: 2},
        {key: 'gender', label: 'Gender', value: 'M', order: 3},
        {key: 'profession', label: 'Profession', value: 'Software Developer', order: 4}
    ];

    const props: AboutProps = {
        skills,
        info,
        name: "Matteo Tatoni",
        description: "I am a software developer with experience using Open Source technologies. " +
            "I mainly work with Java, Spring Boot, PostgreSQL, and Linux systems, " +
            "and I integrate tools like Apache Syncope and Apereo CAS for identity and authentication management. " +
            "This has helped me better understand complex system architectures and development processes."
    };

    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? <AboutMobile {...props} /> : <AboutDesktop {...props} />;
};

export default About;
