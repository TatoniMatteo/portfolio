import {motion} from "framer-motion";
import {useTranslation} from "react-i18next";
import {CURRENT_YEAR} from "../../utils/date";
import "./Footer.css";

const Footer = () => {
    const { t } = useTranslation();

    const yearText = CURRENT_YEAR === 2025 ? "2025" : `2025 - ${CURRENT_YEAR}`;

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
                <p>© {yearText} Matteo Tatoni. {t("footer.rights")}</p>
            </motion.div>
        </motion.footer>
    );
};

export default Footer;
