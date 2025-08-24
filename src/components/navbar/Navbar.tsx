import Logo from '../../assets/logo.svg?react';
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
                    return (
                        <motion.li
                            key={index}
                            className={`nav-item ${isContact ? "contact-item" : ""}`}
                            initial={{opacity: 0, y: -10}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: false, amount: 0.5}}
                            transition={{delay: 0.1 * index, duration: 0.5, ease: "easeOut"}}
                            whileHover={isContact ? {scale: 1.05} : {}}
                        >
                            {item}
                        </motion.li>
                    )
                })}
            </ul>
        </div>
    )
}

export default Navbar;
