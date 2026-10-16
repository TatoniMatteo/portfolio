import { useTranslation } from 'react-i18next';
import NavbarDesktop from './NavbarDesktop';
import NavbarMobile from './NavbarMobile';
import { useIsMobile } from '../../hooks/useIsMobile';
import * as React from "react";

// L'id è l'ancora reale della sezione (#about-me, #career, ...) e NON
// cambia con la lingua. La label è invece tradotta e mostrata all'utente.
// Se aggiungi una sezione, aggiungi qui il suo id e nel file di traduzione
// (src/i18n/locales/*.json, chiave "nav") la relativa label.
export interface NavMenuItem {
    id: string;
    label: string;
}

export type NavbarProps = {
    logo: React.ReactNode;
    menuItems: NavMenuItem[];
};

const Navbar = () => {
    const isMobile = useIsMobile();
    const { t } = useTranslation();

    const menuItems: NavMenuItem[] = [
        { id: 'home', label: t('nav.home') },
        { id: 'about-me', label: t('nav.aboutMe') },
        { id: 'career', label: t('nav.career') },
        { id: 'resume', label: t('nav.resume') },
        { id: 'open-source', label: t('nav.openSource') },
        { id: 'my-projects', label: t('nav.myProjects') },
        { id: 'contact-me', label: t('nav.contactMe') },
    ];

    const props: NavbarProps = {
        logo: <a className="brand" href="#home" aria-label="Matteo Tatoni">
            <img className="brand-image" src={`${import.meta.env.BASE_URL}brand/mt-logo.png`} alt="" decoding="async" width="64" height="42"/>
            <span className="brand-name">Matteo<br/><strong>Tatoni</strong></span>
        </a>,
        menuItems
    };

    return isMobile ? (
        <NavbarMobile {...props} />
    ) : (
        <NavbarDesktop {...props} />
    );
};

export default Navbar;
