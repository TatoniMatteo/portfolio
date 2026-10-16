import {useTranslation} from 'react-i18next';
import type {NavbarProps} from './Navbar';
import ThemeSwitcher from '../theme-switcher/ThemeSwitcher';
import LanguageSwitcher from '../language-switcher/LanguageSwitcher';

const NavbarDesktop = ({logo, menuItems}: NavbarProps) => {
    const {t} = useTranslation();
    return (
        <nav aria-label={t("nav.menu")} className="navbar-desktop">
            <div className="logo-wrapper">{logo}</div>

            <ul className="nav-menu">
                {menuItems.map((item, index) => {
                    const isContact = index === menuItems.length - 1;
                    return (
                        <li
                            key={item.id}
                            className={`nav-item ${isContact ? 'contact-item' : ''}`}
                        >
                            <a href={`#${item.id}`}>{item.label}</a>
                        </li>
                    );
                })}
            </ul>

            <div className="navbar-controls"><ThemeSwitcher/><LanguageSwitcher/></div>
        </nav>
    );
};

export default NavbarDesktop;
