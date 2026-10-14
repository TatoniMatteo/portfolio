import {motion} from 'framer-motion';
import type {NavbarProps} from './Navbar';
import LanguageSwitcher from '../language-switcher/LanguageSwitcher';
import './NavbarDesktop.css';

const NavbarDesktop = ({logo, menuItems, backgroundColor}: NavbarProps) => {
    return (
        <div className="navbar-desktop" style={{backgroundColor}}>
            <motion.div
                className="logo-wrapper"
                initial={{opacity: 0, y: -20}}
                whileInView={{opacity: 1, y: 0}}
                transition={{duration: 0.8, ease: "easeOut"}}
            >
                {logo}
            </motion.div>

            <ul className="nav-menu">
                {menuItems.map((item, index) => {
                    const isContact = index === menuItems.length - 1;
                    return (
                        <motion.li
                            key={item.id}
                            className={`nav-item ${isContact ? 'contact-item' : ''}`}
                            initial={{opacity: 0, y: -10}}
                            whileInView={{opacity: 1, y: 0}}
                            transition={{duration: 0.3, ease: "easeOut"}}
                            whileHover={isContact ? {scale: 1.05} : {}}
                        >
                            <a href={`#${item.id}`}>{item.label}</a>
                        </motion.li>
                    );
                })}
            </ul>

            <LanguageSwitcher/>
        </div>
    );
};

export default NavbarDesktop;
