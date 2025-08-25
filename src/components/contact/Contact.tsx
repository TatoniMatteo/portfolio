import {motion} from 'framer-motion';
import resume from '../../assets/documents/resume.pdf'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEnvelope,} from '@fortawesome/free-solid-svg-icons';
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
import './Contact.css';
import type {IconDefinition} from "@fortawesome/fontawesome-svg-core";

interface ContactItem {
    label: string;
    icon: IconDefinition;
    href: string;
    external?: boolean;
}

const contacts: ContactItem[] = [
    {label: 'Email', icon: faEnvelope, href: 'mailto:tatonimatteo@gmail.com'},
    {label: 'LinkedIn', icon: faLinkedin, href: 'https://linkedin.com/in/matteo-tatoni', external: true},
    {
        label: 'Stack Overflow',
        icon: faStackOverflow,
        href: 'https://stackoverflow.com/users/13746083/matteo-tatoni',
        external: true
    },
    {label: 'GitHub', icon: faGithub, href: 'https://github.com/TatoniMatteo', external: true},
    {label: 'Instagram', icon: faInstagram, href: 'https://instagram.com/matteo_tatoni', external: true},
    {label: 'Facebook', icon: faFacebook, href: 'https://facebook.com/matteo.tatoni.01', external: true},
    {label: 'Telegram', icon: faTelegram, href: 'https://t.me/MatteoTat', external: true},
    {label: 'Whatsapp', icon: faWhatsapp, href: 'https://wa.me/3318985076', external: true},
    {label: 'PayPal', icon: faPaypal, href: 'https://paypal.me/MatteoTatoni', external: true},
    {label: 'Gravatar', icon: faGrav, href: 'https://gravatar.com/slowlyscrumptious77d09727bf', external: true}
];

const Contact = () => {
    return (
        <div className="section" id="contact-me">
            <div className="section-title">
                <h1>Contact Me</h1>
            </div>
            <div className="section-contacts">
                <div className="contact-grid">
                    {contacts.map((c) => (
                        <motion.a
                            key={c.label}
                            href={c.href}
                            target={c.external ? "_blank" : "_self"}
                            rel={c.external ? "noopener" : undefined}
                            className="contact-card"
                            initial={{rotate: 0, scale: 1}}
                            whileHover={{
                                rotate: [0, 10, -10, 5, -5, 0],
                                scale: 1.2,
                            }}
                            transition={{duration: 0.6, ease: "easeInOut"}}
                            whileInView={{opacity: 1, y: 0}}
                        >
                            <FontAwesomeIcon icon={c.icon} size="2x"/>
                            <span>{c.label}</span>
                        </motion.a>
                    ))}
                </div>

                <motion.div
                    className="cv-preview"
                    initial={{opacity: 0, scale: 0.9}}
                    whileInView={{opacity: 1, scale: 1}}
                    viewport={{once: false, amount: 0.3}}
                    transition={{duration: 0.8}}
                >
                    <iframe
                        src={resume}
                        title="CV Preview"
                        width="100%"
                        height="100%"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
