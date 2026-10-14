import './Project.css';
import WaterHealth from '../../assets/images/water-project.png';
import Portfolio from '../../assets/images/portfolio.png';
import {useEffect, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faStar, faCodeBranch} from '@fortawesome/free-solid-svg-icons';

const GITHUB_USERNAME = 'TatoniMatteo';

interface CuratedProject {
    kind: 'curated';
    title: string;
    description: string;
    image: string;
    link?: string;
}

interface RepoProject {
    kind: 'repo';
    title: string;
    description: string;
    link: string;
    stars: number;
    forks: number;
    language: string | null;
}

type ProjectItem = CuratedProject | RepoProject;

// Repo GitHub già mostrati come progetti curati sotto: evitiamo di
// duplicarli quando arrivano anche dalla fetch automatica.
const curatedRepoNames = new Set(['water-project', 'portfolio']);

interface GitHubRepo {
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    fork: boolean;
    archived: boolean;
}

const Project = () => {
    const {t} = useTranslation();
    const [selected, setSelected] = useState(0);
    const [extraProjects, setExtraProjects] = useState<RepoProject[]>([]);
    const [loadingExtra, setLoadingExtra] = useState(true);

    // Progetti scritti a mano, con titolo/descrizione tradotti e immagine
    // curata: restano sempre in cima alla lista, in qualunque lingua.
    const curatedProjects: CuratedProject[] = [
        {
            kind: 'curated',
            title: t('project.curated.waterHealth.title'),
            description: t('project.curated.waterHealth.description'),
            image: WaterHealth,
            link: 'https://github.com/TatoniMatteo/Water-Project'
        },
        {
            kind: 'curated',
            title: t('project.curated.portfolio.title'),
            description: t('project.curated.portfolio.description'),
            image: Portfolio,
            link: 'https://github.com/TatoniMatteo/portfolio'
        }
    ];

    useEffect(() => {
        let cancelled = false;

        const loadRepos = async () => {
            try {
                const res = await fetch(
                    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=12`
                );
                if (!res.ok) throw new Error(`GitHub API ${res.status}`);
                const repos: GitHubRepo[] = await res.json();

                // Nota limite i18n: la descrizione qui sotto viene presa così
                // com'è da GitHub (di solito in inglese) e NON viene tradotta
                // automaticamente, perché arriva a runtime da un servizio
                // esterno e non dai file src/i18n/locales/*.json.
                const mapped: RepoProject[] = repos
                    .filter((r) => !r.fork && !r.archived && r.description)
                    .filter((r) => !curatedRepoNames.has(r.name.toLowerCase()))
                    .slice(0, 4)
                    .map((r) => ({
                        kind: 'repo',
                        title: r.name,
                        description: r.description ?? '',
                        link: r.html_url,
                        stars: r.stargazers_count,
                        forks: r.forks_count,
                        language: r.language,
                    }));

                if (!cancelled) setExtraProjects(mapped);
            } catch {
                // Offline, rate-limit GitHub, o rete bloccata: nessun problema,
                // restano visibili solo i progetti curati a mano.
                if (!cancelled) setExtraProjects([]);
            } finally {
                if (!cancelled) setLoadingExtra(false);
            }
        };

        void loadRepos();

        return () => {
            cancelled = true;
        };
    }, []);

    const projects: ProjectItem[] = [...curatedProjects, ...extraProjects];
    const current = projects[selected] ?? projects[0];

    return (
        <div className="section" id="my-projects">
            <div className="section-title">
                <h1>{t('project.title')}</h1>
            </div>

            <div className="project-container">
                <div className="project-list">
                    {projects.map((p, index) => (
                        <motion.div
                            key={p.title + index}
                            className={`project-item ${selected === index ? 'active' : ''}`}
                            onClick={() => setSelected(index)}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.98}}
                            transition={{duration: 0.2}}
                        >
                            {p.title}
                        </motion.div>
                    ))}
                    {loadingExtra && (
                        <div className="project-item project-item-loading">{t('project.loadingMore')}</div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.title}
                        className="project-preview"
                        initial={{opacity: 0, x: 50}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -50}}
                        transition={{duration: 0.3}}
                    >
                        {current.kind === 'curated' ? (
                            <img src={current.image} alt={current.title}/>
                        ) : (
                            <div className="project-repo-meta">
                                {current.language && <span className="repo-badge">{current.language}</span>}
                                <span className="repo-badge">
                                    <FontAwesomeIcon icon={faStar}/> {current.stars}
                                </span>
                                <span className="repo-badge">
                                    <FontAwesomeIcon icon={faCodeBranch}/> {current.forks}
                                </span>
                            </div>
                        )}

                        <p>{current.description}</p>

                        {current.link && (
                            <a href={current.link} target="_blank" rel="noopener noreferrer">
                                {t('project.viewProject')}
                            </a>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Project;
