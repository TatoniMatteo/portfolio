import {useRef, useState} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import {motion} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import type {NavbarProps} from './Navbar';
import ThemeSwitcher from '../theme-switcher/ThemeSwitcher';
import LanguageSwitcher from '../language-switcher/LanguageSwitcher';

const NavbarMobile = ({logo, menuItems}: NavbarProps) => {
    const {reduced, timings, ease} = useMotionTheme();
    const [isOpen, setIsOpen] = useState(false);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const {t} = useTranslation();

    return (
        <nav className="navbar-mobile" aria-label={t('nav.menu')}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && isOpen) {
                    setIsOpen(false);
                    toggleRef.current?.focus();
                }
            }}>
            <div className="logo-wrapper">{logo}</div>
            <div className="navbar-controls">
            <ThemeSwitcher/>
            <button type="button" ref={toggleRef}
                className={`hamburger ${isOpen ? 'open' : ''}`}
                aria-label={t('nav.menu')} aria-expanded={isOpen} aria-controls="mobile-navigation"
                onClick={() => setIsOpen((open) => !open)}>
                <span/><span/><span/>
            </button>
            </div>
            <motion.ul id="mobile-navigation" inert={!isOpen} aria-hidden={!isOpen}
                className={`nav-menu ${isOpen ? 'open' : ''}`}
                initial={false}
                animate={isOpen ? {opacity: 1, y: 0} : {opacity: 0, y: reduced ? 0 : -6}}
                transition={{duration: timings.normal, ease}}>
                {menuItems.map((item, index) => (
                    <li key={item.id} className={`nav-item ${index === menuItems.length - 1 ? 'contact-item' : ''}`}>
                        <a href={`#${item.id}`} onClick={() => {
                            setIsOpen(false);
                            toggleRef.current?.focus();
                        }}>{item.label}</a>
                    </li>
                ))}
                <li className="nav-item nav-item-language"><LanguageSwitcher/></li>
            </motion.ul>
        </nav>
    );
};
export default NavbarMobile;
