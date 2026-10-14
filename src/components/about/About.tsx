import type * as React from "react";
import {useTranslation} from "react-i18next";
import type {IconDefinition} from "@fortawesome/fontawesome-svg-core";
import AboutDesktop from "./AboutDesktop";
import AboutMobile from "./AboutMobile";
import Java from "../../assets/images/java.svg?react";
import Spring from "../../assets/images/spring.svg?react";
import PGSQL from "../../assets/images/pgsql.svg?react";
import HTML from "../../assets/images/HTML.svg?react";
import CSS from "../../assets/images/CSS.svg?react";
import Linux from "../../assets/images/linux.svg?react";
import Syncope from "../../assets/images/syncope.jpg";
import CAS from "../../assets/images/cas.svg?react";
import Maven from "../../assets/images/maven.svg?react";
import React_ from "../../assets/images/react.svg?react";
import JavaScript from "../../assets/images/javascript.svg?react";
import TypeScript from "../../assets/images/typescript.svg?react";
import Docker from "../../assets/images/docker.svg?react";
import Git from "../../assets/images/git.svg?react";
import GitHub from "../../assets/images/github.svg?react";
import OpenAI from "../../assets/images/openai.svg?react";
import Claude from "../../assets/images/claude.svg?react";
import Gemini from "../../assets/images/google-gemini.svg?react";
import Jetbrains from "../../assets/images/jetbrains.svg?react";
import {useIsMobile} from "../../hooks/useIsMobile";
import {CURRENT_AGE} from "../../utils/date";
import "./About.css";

interface Skill {
    Component?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    alt?: string;
    src?: string;
    type: "svg" | "img" | "fa";
    faIcon?: IconDefinition;
    label?: string;
}

const skills: Skill[] = [
    {type: "svg", Component: Java, label: "Java"},
    {type: "svg", Component: Spring, label: "Spring Boot"},
    {type: "svg", Component: PGSQL, label: "PostgreSQL"},
    {type: "img", src: Syncope, alt: "Apache Syncope", label: "Apache Syncope"},
    {type: "svg", Component: CAS, label: "Apereo CAS"},
    {type: "svg", Component: Maven, label: "Maven"},
    {type: "svg", Component: HTML, label: "HTML"},
    {type: "svg", Component: CSS, label: "CSS"},
    {type: "svg", Component: React_, label: "React"},
    {type: "svg", Component: JavaScript, label: "JavaScript"},
    {type: "svg", Component: TypeScript, label: "TypeScript"},
    {type: "svg", Component: Docker, label: "Docker"},
    {type: "svg", Component: Git, label: "Git"},
    {type: "svg", Component: GitHub, label: "GitHub"},
    {type: "svg", Component: Linux, label: "Linux"},
    {type: "svg", Component: Jetbrains, label: "JetBrains Suite"},
    {type: "svg", Component: OpenAI, label: "OpenAI"},
    {type: "svg", Component: Claude, label: "Claude AI"},
    {type: "svg", Component: Gemini, label: "Gemini AI"},
];

export interface InfoItem {
    key: string;
    label: string;
    value: string | number;
    order: number;
}

export interface AboutProps {
    title: string;
    skills: Skill[];
    info: InfoItem[];
    name: string;
    description: string;
}

const About = () => {
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    const info: InfoItem[] = [
        {
            key: "age",
            label: t("about.info.age"),
            value: CURRENT_AGE,
            order: 1,
        },
        {
            key: "residence",
            label: t("about.info.residence"),
            value: t("about.info.residenceValue"),
            order: 2,
        },
        {
            key: "gender",
            label: t("about.info.gender"),
            value: "M",
            order: 3,
        },
        {
            key: "profession",
            label: t("about.info.profession"),
            value: t("about.info.professionValue"),
            order: 4,
        },
    ];

    const props: AboutProps = {
        title: t("about.title"),
        skills,
        info,
        name: "Matteo Tatoni",
        description: t("about.description"),
    };

    return isMobile ? <AboutMobile {...props} /> : <AboutDesktop {...props} />;
};

export default About;
