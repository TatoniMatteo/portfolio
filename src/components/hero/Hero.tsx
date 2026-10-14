import { useTranslation } from 'react-i18next';
import HeroDesktop from './HeroDesktop';
import HeroMobile from './HeroMobile';
import profile_img from '../../assets/images/profile.jpeg';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useResumeUrl } from '../../hooks/useResumeUrl';
import './Hero.css';

export type HeroProps = {
    profileImg: string;
    resumeFile: string;
    name: string;
    role: string;
    description: string;
};

const Hero = () => {
    const isMobile = useIsMobile();
    const { t } = useTranslation();
    const resume = useResumeUrl();

    const props: HeroProps = {
        profileImg: profile_img,
        resumeFile: resume,
        name: "Matteo Tatoni", // nome proprio: non va tradotto
        role: t('hero.role'),
        description: t('hero.description'),
    };

    return isMobile ? <HeroMobile {...props} /> : <HeroDesktop {...props} />;
};

export default Hero;
