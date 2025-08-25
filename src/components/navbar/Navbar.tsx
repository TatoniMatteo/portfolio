import Logo from '../../assets/images/logo.svg?react';
import './Navbar.css'
import {motion} from 'framer-motion';

const Navbar = () => {
    const menuItems = ["Home", "About Me", "Career", "My projects", "Contact Me"];

    return (
        <div className="navbar">
            <motion.div
                className="logo"
                initial={{opacity: 0, y: -20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: false, amount: 0.5}}
                transition={{duration: 0.8, ease: "easeOut"}}
            >
                <Logo className="logo"/>
            </motion.div>

            <ul className="nav-menu">
                {menuItems.map((item, index) => {
                    const isContact = index === menuItems.length - 1;
                    // crea l'id della sezione convertendo in minuscolo e sostituendo spazi con "-"
                    const href = `#${item.toLowerCase().replace(/\s+/g, '-')}`;
                    return (
                        <motion.li
                            key={index}
                            className={`nav-item ${isContact ? "contact-item" : ""}`}
                            initial={{opacity: 0, y: -10}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: false, amount: 0.5}}
                            transition={{duration: 0.3, ease: "easeOut"}}
                            whileHover={isContact ? {scale: 1.05} : {}}
                        >
                            <a href={href}>{item}</a>
                        </motion.li>
                    )
                })}
            </ul>
        </div>
    )
}

export default Navbar;
