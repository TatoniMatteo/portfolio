// Footer.tsx
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import './Footer.css';

const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();
    const yearText = currentYear === 2025 ? "2025" : `2025 - ${currentYear}`;

    return (
        <motion.footer
            className="footer-container"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 1 }}
        >
            <motion.div
                className="footer-content"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ delay: 0.3, duration: 1 }}
            >
                <p>© {yearText} Matteo Tatoni. {t('footer.rights')}</p>
            </motion.div>
        </motion.footer>
    );
};

export default Footer;
