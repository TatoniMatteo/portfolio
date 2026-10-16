import type * as React from "react";
import {useTranslation} from "react-i18next";
import AboutContent from "./AboutContent";
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

import GitHub from '../../assets/images/github.svg?react';
import OpenAI from '../../assets/images/openai.svg?react';
import Claude from '../../assets/images/claude.svg?react';
import Gemini from '../../assets/images/google-gemini.svg?react';
import Jetbrains from '../../assets/images/jetbrains.svg?react';
import {CURRENT_AGE} from '../../utils/date';

type Skill =
    | {type: "svg"; Component: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string}
    | {type: "img"; src: string; label: string; alt?: string};

const groups: SkillGroup[] = [
    {id: 'backend', skills: [
        {type: 'svg', Component: Java, label: 'Java'},
        {type: 'svg', Component: Spring, label: 'Spring Boot'},
        {type: 'svg', Component: PGSQL, label: 'PostgreSQL'},
    ]},
    {id: 'identity', skills: [
        {type: 'img', src: Syncope, label: 'Apache Syncope'},
        {type: 'svg', Component: CAS, label: 'Apereo CAS'},
    ]},
    {id: 'frontend', skills: [
        {type: 'svg', Component: React_, label: 'React'},
        {type: 'svg', Component: TypeScript, label: 'TypeScript'},
        {type: 'svg', Component: JavaScript, label: 'JavaScript'},
        {type: 'svg', Component: HTML, label: 'HTML'},
        {type: 'svg', Component: CSS, label: 'CSS'},
    ]},
    {id: 'tools', skills: [
        {type: 'svg', Component: Linux, label: 'Linux'},
        {type: 'svg', Component: Docker, label: 'Docker'},
        {type: 'svg', Component: Git, label: 'Git'},
        {type: 'svg', Component: Maven, label: 'Maven'},
        {type: 'svg', Component: GitHub, label: 'GitHub'},
        {type: 'svg', Component: Jetbrains, label: 'JetBrains Suite'},
    ]},
    {id: 'ai', skills: [
        {type: 'svg', Component: OpenAI, label: 'OpenAI'},
        {type: 'svg', Component: Claude, label: 'Claude AI'},
        {type: 'svg', Component: Gemini, label: 'Gemini AI'},
    ]},
];

export interface SkillGroup {
    id: 'backend' | 'identity' | 'frontend' | 'tools' | 'ai';
    skills: Skill[];
}

const About = () => {
    const {t} = useTranslation();
    return <AboutContent groups={groups} title={t('about.title')}
        paragraphs={t('about.description').split('\n\n')} location={t('about.location')}
        profession={t('about.profession')} name="Matteo Tatoni" age={CURRENT_AGE}/>;
};

export default About;
