import {openSourceProjects} from '../../data/openSource';
import type {OpenSourceProject} from '../../data/openSource';
import SectionTitle from '../section-title/SectionTitle';
import {useEffect, useState} from 'react';
import {useMotionTheme} from '../../hooks/useMotionTheme';
import {motion} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUpRightFromSquare, faCodePullRequest} from '@fortawesome/free-solid-svg-icons';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import {githubJSON, isRecord, isSearchResponse, pullRequestStatus} from '../../lib/github';
import type {GitHubSearchItem} from '../../lib/github';

const GITHUB_USERNAME = 'TatoniMatteo';

interface GitHubRepository {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
}

interface ProjectData {
    repository: GitHubRepository;
    pullRequestCount?: number;
    latestPullRequest?: GitHubSearchItem;
}

const getRepository = async (
    project: OpenSourceProject,
): Promise<GitHubRepository> => {
    return githubJSON(`/repos/${project.owner}/${project.repo}`, (value): value is GitHubRepository =>
        isRecord(value) && typeof value.name === 'string' && typeof value.full_name === 'string' &&
        (value.description === null || typeof value.description === 'string') &&
        typeof value.html_url === 'string' && value.html_url.startsWith('https://github.com/'));
};

const loadProject = async (project: OpenSourceProject): Promise<ProjectData> => {
    const query = encodeURIComponent(`repo:${project.owner}/${project.repo} type:pr author:${GITHUB_USERNAME}`);
    const [repoResult, prResult] = await Promise.allSettled([
        getRepository(project),
        githubJSON(`/search/issues?q=${query}&sort=created&order=desc&per_page=1`, isSearchResponse),
    ]);
    const repository: GitHubRepository = repoResult.status === 'fulfilled' ? repoResult.value : {
        name: project.repo,
        full_name: `${project.owner}/${project.repo}`,
        description: null,
        html_url: `https://github.com/${project.owner}/${project.repo}`,
    };
    return {
        repository,
        pullRequestCount: prResult.status === 'fulfilled' ? prResult.value.total_count : undefined,
        latestPullRequest: prResult.status === 'fulfilled' ? prResult.value.items[0] : undefined,
    };
};

// Il formato data segue la lingua attiva (it-IT vs en-US) invece di essere
// fisso: passa i18n.language da dove viene chiamata.
const formatDate = (date: string, locale: string): string => {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
};

interface OpenSourceProjectCardProps {
    project: ProjectData;
}

const OpenSourceProjectCard = ({
    project,
}: OpenSourceProjectCardProps) => {
    const {t, i18n} = useTranslation();
    const {
        repository,
        pullRequestCount,
        latestPullRequest,
    } = project;

    const hasPullRequests =
        (pullRequestCount ?? 0) > 0 && latestPullRequest !== undefined;

    const {reveal} = useMotionTheme();
    return (
        <motion.article className="contribution-card"
            {...reveal}>
            <div className="contribution-project">
                <div className="contribution-repository">
                    <span className="contribution-icon"><FontAwesomeIcon icon={faGithub}/></span>
                    <div><span className="contribution-owner">{repository.full_name}</span><h3>{repository.name}</h3></div>
                </div>
                <p>{repository.description ?? t('openSource.noDescription')}</p>
            </div>
            <div className="contribution-stats">
                <div className="contribution-count">
                    <strong>{pullRequestCount ?? '–'}</strong>
                    <span>{pullRequestCount === undefined ? t('openSource.fallback') : t('openSource.pullRequestCount', {count: pullRequestCount})}</span>
                </div>
                {hasPullRequests ? (
                    <div className="contribution-latest">
                        <span className="contribution-label"><FontAwesomeIcon icon={faCodePullRequest}/>{t('openSource.latestPr')}</span>
                        <h4><a href={`${repository.html_url}/pull/${latestPullRequest.number}`} target="_blank" rel="noopener noreferrer">#{latestPullRequest.number} {latestPullRequest.title}</a></h4>
                        <div className="contribution-meta">
                            <time dateTime={latestPullRequest.created_at}>{formatDate(latestPullRequest.created_at, i18n.language)}</time>
                            <span className="contribution-status">{t(`openSource.status.${pullRequestStatus(latestPullRequest)}`)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="contribution-latest">
                        <span className="contribution-label">{t('openSource.contributionsLabel')}</span>
                        <p>{t(pullRequestCount === undefined ? 'openSource.error' : 'openSource.noContributions')}</p>
                    </div>
                )}
            </div>
            <div className="contribution-links">
                <a className="contribution-repo-link" href={repository.html_url} target="_blank" rel="noopener noreferrer">{t('openSource.repositoryLink')}<FontAwesomeIcon icon={faUpRightFromSquare}/></a>
                <a href={`${repository.html_url}/pulls?q=${encodeURIComponent(`is:pr author:${GITHUB_USERNAME}`)}`} target="_blank" rel="noopener noreferrer">{t('openSource.allContributions')}<FontAwesomeIcon icon={faUpRightFromSquare}/></a>
            </div>
        </motion.article>
    );
};

const OpenSource = () => {
    const {t} = useTranslation();
    const [contributions, setContributions] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadProjects = async () => {
            try {
                setLoading(true);
                setError(false);

                const results = await Promise.all(openSourceProjects.map(loadProject));

                if (!cancelled) {
                    setContributions(results);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Unable to load GitHub contributions", err);
                    setError(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadProjects();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="section" id="open-source">
            <SectionTitle>{t('openSource.title')}</SectionTitle>

            <div className={`open-source-layout${openSourceProjects.length > 1 ? ' has-multiple-projects' : ''}`}>
                <div className="open-source-story">
                    <span className="open-source-foundation">Apache Software Foundation</span>
                    <h3>Apache Syncope Committer</h3>
                    <p className="open-source-intro">{t('openSource.intro')}</p>
                    <a className="open-source-profile" href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faGithub}/>{t('openSource.profileLink')}<FontAwesomeIcon icon={faUpRightFromSquare}/></a>
                </div>
            <div className="contribution-grid">
                {loading && (
                    <div className="contribution-card">
                        <div className="contribution-project">
                            <FontAwesomeIcon
                                icon={faGithub}
                                size="lg"
                            />

                            <h3>GitHub</h3>

                            <p>
                                {t('openSource.loading')}
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="contribution-card">
                        <div className="contribution-project">
                            <FontAwesomeIcon
                                icon={faGithub}
                                size="lg"
                            />

                            <h3>GitHub</h3>

                            <p>
                                {t('openSource.error')}
                            </p>
                        </div>
                    </div>
                )}

                {!loading &&
                    !error &&
                    contributions.map((project) => (
                        <OpenSourceProjectCard
                            key={project.repository.full_name}
                            project={project}
                        />
                    ))}
            </div>
            </div>
        </div>
    );
};

export default OpenSource;
