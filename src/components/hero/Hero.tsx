import { useTranslation } from 'react-i18next';
import HeroContent from './HeroContent';
import profile_img from '../../assets/images/profile.jpeg';
import { useResumeUrl } from '../../hooks/useResumeUrl';

export type HeroProps = {
    profileImg: string;
    resumeFile: string;
    name: string;
    role: string;
    description: string;
};

const Hero = () => {
    const { t } = useTranslation();
    const resume = useResumeUrl();

    const props: HeroProps = {
        profileImg: profile_img,
        resumeFile: resume,
        name: "Matteo Tatoni", // nome proprio: non va tradotto
        role: t('hero.role'),
        description: t('hero.description'),
    };

    return <HeroContent {...props} />;
};

export default Hero;
