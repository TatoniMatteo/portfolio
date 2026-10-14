import {useTranslation} from "react-i18next";
import {faAward, faGraduationCap, faLaptopCode} from "@fortawesome/free-solid-svg-icons";
import type {TimelineEvent} from "../timeline/Timeline";
import Timeline from "../timeline/Timeline";
import "./Career.css";

const icons = [faGraduationCap, faGraduationCap, faLaptopCode, faAward, faLaptopCode];

type TranslatedEvent = Omit<TimelineEvent, "icon">;

const isTranslatedEvent = (value: unknown): value is TranslatedEvent => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return (
        "date" in value && typeof value.date === "string" &&
        "title" in value && typeof value.title === "string" &&
        "description" in value && typeof value.description === "string"
    );
};

const Career = () => {
    const { t } = useTranslation();
    const translatedEvents: unknown = t("career.events", {returnObjects: true});

    const events: TimelineEvent[] = Array.isArray(translatedEvents)
        ? translatedEvents.filter(isTranslatedEvent).map((event, index) => ({
            ...event,
            icon: icons[index] ?? faLaptopCode,
        }))
        : [];

    return (
        <div className="section" id="career">
            <div className="section-title">
                <h1>{t("career.title")}</h1>
            </div>
            <div className="career-body">
                <Timeline events={events}/>
            </div>
        </div>
    );
};

export default Career;
