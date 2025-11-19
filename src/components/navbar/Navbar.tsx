import {useEffect, useState} from 'react';
import NavbarDesktop from './NavbarDesktop';
import NavbarMobile from './NavbarMobile';
import Logo from '../../assets/images/logo.svg?react';
import './Navbar.css';
import * as React from "react";

export type NavbarProps = {
    logo: React.ReactNode;
    menuItems: string[];
    backgroundColor?: string;
};

const Navbar = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = ["Home", "About Me", "Career", "My projects", "Contact Me"];

    const props: NavbarProps = {
        logo: <Logo className="logo"/>,
        menuItems,
        backgroundColor: 'var(--color-bg)'
    };

    return isMobile ? (
        <NavbarMobile {...props} />
    ) : (
        <NavbarDesktop {...props} />
    );
};

export default Navbar;
