import './Career.css'
import Timeline, {type TimelineEvent} from "../timeline/Timeline.tsx";
import {faAward, faGraduationCap, faLaptopCode} from "@fortawesome/free-solid-svg-icons";

const Career = () => {
    const events: TimelineEvent[] = [
        {
            year: "2014 - 2019",
            title: "High School Diploma",
            subtitle: "Liceo Scientifico G. Galilei (Pescara)",
            description: "High School Diploma with a score of 83/100.\nStudied mathematics, physics, chemistry, biology, Latin, and philosophy.",
            icon: faGraduationCap
        },
        {
            year: "2020 - 2023",
            title: "Bachelor in Computer Science",
            subtitle: "Università degli Studi dell'Aquila",
            description: "Bachelor's degree in Computer Science with a score of 110/110.\nStudied programming languages, software design, algorithms, information systems, and databases.",
            icon: faGraduationCap
        },
        {
            year: "2023 - 2025",
            title: "Tirasa s.r.l.",
            subtitle: "Apprenticeship - Software Developer",
            description: "Developed custom features using Java, Spring Boot, PostgreSQL, and Linux.\nGained experience with Apache Syncope and Apereo CAS.",
            icon: faLaptopCode
        },
        {
            year: "2025",
            title: "Apache Syncope Committer",
            subtitle: "Apache Software Foundation",
            description: "Became an official committer for the Apache Software Foundation on the Apache Syncope project, contributing to feature development, improvements, and code quality.",
            icon: faAward
        },
        {
            year: "2025 - Now",
            title: "Tirasa s.r.l.",
            subtitle: "Software Developer",
            description: "Currently working on software development and support for enterprise clients.\nTechnologies: Java, Spring Boot, PostgreSQL, Linux, Apache Syncope, Apereo CAS.",
            icon: faLaptopCode
        }
    ];

    return (
        <div className="section" id="career">
            <div className="section-title">
                <h1>Career</h1>
            </div>
            <div className="career-body">
                <Timeline events={events}/>
            </div>
        </div>
    )
}
export default Career;