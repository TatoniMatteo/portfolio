import SectionTitle from '../section-title/SectionTitle';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import {useIsMobile} from '../../hooks/useIsMobile';
import MobilePanels from '../mobile-panels/MobilePanels';
import {motion} from 'framer-motion';
import {Trans, useTranslation} from 'react-i18next';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faLocationDot} from '@fortawesome/free-solid-svg-icons';
import type {SkillGroup} from './About';

interface AboutContentProps {
    name: string;
    age: number;
    groups: SkillGroup[];
    title: string;
    paragraphs: string[];
    location: string;
    profession: string;
}

const AboutContent = ({groups, title, paragraphs, location, profession, name, age}: AboutContentProps) => {
    const {t} = useTranslation();
    const {reveal} = useMotionTheme();
    const isMobile = useIsMobile();
    const identity = <div className="about-identity">
        <h3>{name}</h3>
        <p className="about-location"><FontAwesomeIcon icon={faLocationDot}/>{location}</p>
    </div>;
    const metadata = <dl className="about-meta">
        <div><dt>{t('about.info.age')}</dt><dd>{age}</dd></div>
        <div><dt>{t('about.info.gender')}</dt><dd>M</dd></div>
        <div><dt>{t('about.info.profession')}</dt><dd>{profession}</dd></div>
    </dl>;
    const skillCards = groups.map((group) => (
        <motion.section key={group.id} className={`skill-group skill-group-${group.id}`}
            aria-labelledby={`skills-${group.id}`}
            {...reveal}>
            <div className="skill-group-heading">
                <h3 id={`skills-${group.id}`}>{t(`about.groups.${group.id}.title`)}</h3>
                <p>{t(`about.groups.${group.id}.context`)}</p>
            </div>
            <ul className="skill-list">
                {group.skills.map((skill) => (
                    <li className="skill-chip" key={skill.label} data-skill={skill.label}>
                        {skill.type === 'svg'
                            ? <skill.Component className="skill-icon" aria-hidden="true" focusable="false"/>
                            : <img className="skill-icon" src={skill.src} alt="" loading="lazy"/>}
                        <span>{skill.label}</span>
                    </li>
                ))}
            </ul>
        </motion.section>
    ));

    if (isMobile) {
        return (
            <section className="section about about-mobile" id="about-me" aria-labelledby="about-heading">
                <div id="about-heading"><SectionTitle>{title}</SectionTitle></div>
                <div className="about-profile">{identity}</div>
                <MobilePanels label={title}>
                    <div className="about-mobile-intro">
                        {metadata}
                        <div className="about-prose"><p><Trans defaults={paragraphs[0]} components={{strong: <strong/>}}/></p></div>
                    </div>
                    {paragraphs.slice(1).map((paragraph) => (
                        <div className="about-prose" key={paragraph}><p><Trans defaults={paragraph} components={{strong: <strong/>}}/></p></div>
                    ))}
                    {skillCards}
                </MobilePanels>
            </section>
        );
    }
    return (
        <section className="section about" id="about-me" aria-labelledby="about-heading">
            <div id="about-heading"><SectionTitle>{title}</SectionTitle></div>
            <motion.div className="about-profile" {...reveal}>
                {identity}
                {metadata}
            </motion.div>
            <div className="about-sections">
                <motion.div className="about-story"
                    {...reveal}>
                    <div className="about-prose">
                        {paragraphs.map((paragraph) => <p key={paragraph}><Trans defaults={paragraph} components={{strong: <strong/>}}/></p>)}
                    </div>
                </motion.div>
                <div className="about-skills" aria-label={t('about.skillsLabel')}>
                    {skillCards}
                </div>
            </div>
        </section>
    );
};

export default AboutContent;
