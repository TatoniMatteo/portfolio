import { useTranslation } from 'react-i18next';
import './Career.css'
import Timeline, {type TimelineEvent} from "../timeline/Timeline.tsx";
import {faAward, faGraduationCap, faLaptopCode} from "@fortawesome/free-solid-svg-icons";

// Le icone non possono stare nel JSON di traduzione (non sono testo),
// quindi restano qui in codice, in ORDINE corrispondente a "career.events"
// nei file src/i18n/locales/*.json. Se aggiungi/rimuovi un evento in un
// file di traduzione, aggiorna anche questo array nello stesso ordine
// (e ripetilo identico in tutte le lingue).
const icons = [faGraduationCap, faGraduationCap, faLaptopCode, faAward, faLaptopCode];

type TranslatedEvent = Omit<TimelineEvent, 'icon'>;

const Career = () => {
    const { t } = useTranslation();

    const translatedEvents = t('career.events', { returnObjects: true }) as unknown as TranslatedEvent[];
    const events: TimelineEvent[] = translatedEvents.map((event, index) => ({
        ...event,
        icon: icons[index] ?? faLaptopCode,
    }));

    return (
        <div className="section" id="career">
            <div className="section-title">
                <h1>{t('career.title')}</h1>
            </div>
            <div className="career-body">
                <Timeline events={events}/>
            </div>
        </div>
    )
}
export default Career;
