import SectionTitle from '../section-title/SectionTitle';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import {motion} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEnvelope, faPhone, faArrowUpRightFromSquare, faArrowRight} from '@fortawesome/free-solid-svg-icons';
import {
    faLinkedin,
    faStackOverflow,
    faGithub,
    faInstagram,
    faFacebook,
    faTelegram,
    faWhatsapp,
    faPaypal,
    faGrav
} from '@fortawesome/free-brands-svg-icons';
import type {IconDefinition} from "@fortawesome/fontawesome-svg-core";

interface ContactItem {
    label: string;
    icon: IconDefinition;
    href: string;
    external?: boolean;
    labelKey?: string;
    detailKey?: string;
    detail?: string;
}

const phoneNumber = '393318985076';

const contacts: ContactItem[] = [
    {label: 'Email', icon: faEnvelope, href: 'mailto:tatonimatteo@gmail.com', detail: 'tatonimatteo@gmail.com'},
    {label: 'GitHub', icon: faGithub, href: 'https://github.com/TatoniMatteo', external: true, detailKey: 'contact.githubHint'},
    {label: 'Phone', labelKey: 'contact.phone', icon: faPhone, href: `tel:+${phoneNumber}`, detail: '+39 331 898 5076'},
    {label: 'Whatsapp', icon: faWhatsapp, href: `https://wa.me/${phoneNumber}`, external: true},
    {label: 'Telegram', icon: faTelegram, href: 'https://t.me/MatteoTat', external: true},
    {label: 'LinkedIn', icon: faLinkedin, href: 'https://linkedin.com/in/matteo-tatoni', external: true},
    {label: 'Instagram', icon: faInstagram, href: 'https://instagram.com/matteo_tatoni', external: true},
    {label: 'Facebook', icon: faFacebook, href: 'https://facebook.com/matteo.tatoni.01', external: true},
    {
        label: 'Stack Overflow',
        icon: faStackOverflow,
        href: 'https://stackoverflow.com/users/13746083/matteo-tatoni',
        external: true
    },
    {label: 'PayPal', icon: faPaypal, href: 'https://paypal.me/MatteoTatoni', external: true},
    {label: 'Gravatar', icon: faGrav, href: 'https://gravatar.com/slowlyscrumptious77d09727bf', external: true}
];

const Contact = () => {
    const {t} = useTranslation();
    const {reveal} = useMotionTheme();
    const featured = contacts.slice(0, 3);
    const otherChannels = contacts.slice(3);

    return (
        <section className="section" id="contact-me">
            <SectionTitle>{t('contact.title')}</SectionTitle>
            <div className="contact-layout">
                <div className="contact-intro">
                    <h3>{t('contact.introTitle')}</h3>
                    <p>{t('contact.introDescription')}</p>
                </div>
                <div className="contact-featured">
                    {featured.map((contact) => (
                        <motion.a key={contact.label} href={contact.href} aria-label={contact.labelKey ? t(contact.labelKey) : contact.label}
                            target={contact.external ? '_blank' : undefined}
                            rel={contact.external ? 'noopener noreferrer' : undefined}
                            className="contact-card contact-primary"
                            {...reveal}>
                            <span className="contact-icon"><FontAwesomeIcon icon={contact.icon}/></span>
                            <span className="contact-primary-text">
                                <strong>{contact.labelKey ? t(contact.labelKey) : contact.label}</strong>
                                <span>{contact.detail ?? (contact.detailKey ? t(contact.detailKey) : '')}</span>
                            </span>
                            <FontAwesomeIcon className="contact-arrow" icon={contact.external ? faArrowUpRightFromSquare : faArrowRight}/>
                        </motion.a>
                    ))}
                </div>
                <div className="contact-secondary">
                    <h3>{t('contact.otherChannels')}</h3>
                    <div className="contact-grid">
                        {otherChannels.map((contact) => (
                            <motion.a key={contact.label} href={contact.href} aria-label={contact.labelKey ? t(contact.labelKey) : contact.label}
                                target="_blank" rel="noopener noreferrer" className="contact-card contact-social"
                                {...reveal}>
                                <FontAwesomeIcon icon={contact.icon}/>
                                <span>{contact.label}</span>
                                <FontAwesomeIcon className="contact-arrow" icon={faArrowUpRightFromSquare}/>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
