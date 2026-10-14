import {useState} from 'react';
import {motion} from 'framer-motion';
import type {NavbarProps} from './Navbar';
import LanguageSwitcher from '../language-switcher/LanguageSwitcher';
import './NavbarMobile.css';

const NavbarMobile = ({logo, menuItems, backgroundColor}: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="navbar-mobile" style={{backgroundColor}}>
            <div className="logo-wrapper">{logo}</div>

            <div className={`hamburger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <motion.ul
                className={`nav-menu ${isOpen ? 'open' : ''}`}
                initial={{opacity: 0, y: -10}}
                animate={isOpen ? {opacity: 1, y: 0} : {opacity: 0, y: -10}}
                transition={{duration: 0.3}}
            >
                {menuItems.map((item, index) => {
                    const isContact = index === menuItems.length - 1;
                    return (
                        <li key={item.id} className={`nav-item ${isContact ? 'contact-item' : ''}`}>
                            <a href={`#${item.id}`} onClick={() => setIsOpen(false)}>
                                {item.label}
                            </a>
                        </li>
                    );
                })}
                <li className="nav-item nav-item-language">
                    <LanguageSwitcher/>
                </li>
            </motion.ul>
        </div>
    );
};

export default NavbarMobile;
