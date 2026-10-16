import SectionTitle from '../section-title/SectionTitle';
import {githubJSON, isRecord} from '../../lib/github';
import WaterHealth from '../../assets/images/water-project.png';
import Portfolio from '../../assets/images/portfolio.png';
import {useEffect, useState} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import {motion, AnimatePresence} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {faStar, faCodeBranch, faUpRightFromSquare} from '@fortawesome/free-solid-svg-icons';

const GITHUB_USERNAME = 'TatoniMatteo';

interface CuratedProject {
    kind: 'curated';
    category: string;
    technologies: string[];
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
    const {swap} = useMotionTheme();
    const [selected, setSelected] = useState(0);
    const [extraProjects, setExtraProjects] = useState<RepoProject[]>([]);
    const [loadingExtra, setLoadingExtra] = useState(true);

    // Progetti scritti a mano, con titolo/descrizione tradotti e immagine
    // curata: restano sempre in cima alla lista, in qualunque lingua.
    const curatedProjects: CuratedProject[] = [
        {
            kind: 'curated',
            title: t('project.curated.waterHealth.title'),
            category: t('project.thesis'),
            technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Android'],
            description: t('project.curated.waterHealth.description'),
            image: WaterHealth,
            link: 'https://github.com/TatoniMatteo/Water-Project'
        },
        {
            kind: 'curated',
            title: t('project.curated.portfolio.title'),
            category: t('project.personal'),
            technologies: ['React', 'TypeScript', 'SASS'],
            description: t('project.curated.portfolio.description'),
            image: Portfolio,
            link: 'https://github.com/TatoniMatteo/portfolio'
        }
    ];

    useEffect(() => {
        let cancelled = false;

        const loadRepos = async () => {
            try {
                const repos = await githubJSON(
                    `/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
                    (value): value is GitHubRepo[] => Array.isArray(value) && value.every((repo: unknown) =>
                        isRecord(repo) && typeof repo.name === 'string' &&
                        (repo.description === null || typeof repo.description === 'string') &&
                        typeof repo.html_url === 'string' && repo.html_url.startsWith('https://github.com/') &&
                        typeof repo.stargazers_count === 'number' && typeof repo.forks_count === 'number' &&
                        (repo.language === null || typeof repo.language === 'string') &&
                        typeof repo.fork === 'boolean' && typeof repo.archived === 'boolean'),
                );

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
            <SectionTitle>{t('project.title')}</SectionTitle>

            <div className="project-container">
                <div className="project-list" role="group" aria-label={t('project.explore')}>
                    <p className="project-list-label">{t('project.explore')}</p>
                    {projects.map((project, index) => (
                        <button type="button" aria-label={project.title}
                            aria-pressed={selected === index} aria-controls="project-preview"
                            key={`${project.kind}-${project.title}`}
                            className={`project-item ${selected === index ? 'active' : ''}`}
                            onClick={() => setSelected(index)}>
                            {project.kind === 'curated'
                                ? <img className="project-thumbnail" src={project.image} alt="" loading="lazy"/>
                                : <span className="project-item-icon"><FontAwesomeIcon icon={faGithub}/></span>}
                            <span className="project-item-label">
                                <span>{project.title}</span>
                                <small>{project.kind === 'curated' ? project.category : t('project.repository')}</small>
                            </span>
                        </button>
                    ))}
                    {loadingExtra && <p className="project-item-loading" role="status">{t('project.loadingMore')}</p>}
                </div>
                <div className="project-detail-panel">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={`${current.kind}-${current.title}`}
                            className="project-preview" id="project-preview" aria-live="polite" aria-atomic="true"
                            {...swap}>
                            {current.kind === 'curated' ? (
                                <div className="project-image"><img src={current.image} alt={current.title} loading="lazy" decoding="async"/></div>
                            ) : (
                                <div className="project-repo-cover" aria-hidden="true"><FontAwesomeIcon icon={faGithub}/></div>
                            )}
                            <div className="project-description">
                                <span className="project-category">{current.kind === 'curated' ? current.category : t('project.repository')}</span>
                                <h3>{current.title}</h3>
                                <p>{current.description}</p>
                                <div className="project-repo-meta">
                                    {current.kind === 'curated' ? current.technologies.map((technology) => <span className="repo-badge" key={technology}>{technology}</span>) : <>
                                        {current.language && <span className="repo-badge">{current.language}</span>}
                                        <span className="repo-badge"><FontAwesomeIcon icon={faStar}/><span>{current.stars} {t('project.stars')}</span></span>
                                        <span className="repo-badge"><FontAwesomeIcon icon={faCodeBranch}/><span>{current.forks} {t('project.forks')}</span></span>
                                    </>}
                                </div>
                                {current.link && <a className="project-link" href={current.link} target="_blank" rel="noopener noreferrer">{t('project.viewProject')}<FontAwesomeIcon icon={faUpRightFromSquare}/></a>}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Project;
