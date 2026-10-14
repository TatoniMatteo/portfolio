import {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Trans, useTranslation} from 'react-i18next';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub} from '@fortawesome/free-brands-svg-icons';
import './OpenSource.css';

const GITHUB_USERNAME = 'TatoniMatteo';

interface GitHubRepository {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
}

interface GitHubPullRequest {
    number: number;
    title: string;
    html_url: string;
    state: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    merged_at: string | null;
}

interface GitHubSearchResponse {
    total_count: number;
    incomplete_results: boolean;
    items: GitHubPullRequest[];
}

interface ProjectConfig {
    owner: string;
    repo: string;
}

interface ProjectData {
    repository: GitHubRepository;
    pullRequestCount: number;
    latestPullRequest?: GitHubPullRequest;
}

const projects: ProjectConfig[] = [
    {owner: 'apache', repo: 'syncope'},
];

const getRepository = async (
    project: ProjectConfig,
): Promise<GitHubRepository> => {
    const response = await fetch(
        `https://api.github.com/repos/${project.owner}/${project.repo}`,
        {
            headers: {
                Accept: 'application/vnd.github+json',
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Unable to load repository ${project.owner}/${project.repo}`,
        );
    }

    return response.json();
};

const getPullRequests = async (
    project: ProjectConfig,
): Promise<GitHubSearchResponse> => {
    const query = encodeURIComponent(
        `repo:${project.owner}/${project.repo} type:pr author:${GITHUB_USERNAME}`,
    );

    const response = await fetch(
        `https://api.github.com/search/issues?q=${query}&sort=created&order=desc&per_page=1`,
        {
            headers: {
                Accept: 'application/vnd.github+json',
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Unable to load pull requests for ${project.owner}/${project.repo}`,
        );
    }

    return response.json();
};

const loadProject = async (
    project: ProjectConfig,
): Promise<ProjectData> => {
    const [repository, pullRequests] = await Promise.all([
        getRepository(project),
        getPullRequests(project),
    ]);

    return {
        repository,
        pullRequestCount: pullRequests.total_count,
        latestPullRequest: pullRequests.items[0],
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

const getPullRequestStatusKey = (
    pullRequest: GitHubPullRequest,
): 'merged' | 'open' | 'closed' => {
    if (pullRequest.merged_at) {
        return 'merged';
    }

    if (pullRequest.state === 'open') {
        return 'open';
    }

    return 'closed';
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
        pullRequestCount > 0 && latestPullRequest !== undefined;

    return (
        <motion.a
            href={repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="contribution-card"
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: false, amount: 0.4}}
            whileHover={{scale: 1.02}}
            transition={{duration: 0.5}}
        >
            <div className="contribution-project">
                <FontAwesomeIcon
                    icon={faGithub}
                    size="lg"
                />

                <h3>{repository.name}</h3>

                <p>
                    {repository.description ?? t('openSource.noDescription')}
                </p>
            </div>

            <div className="contribution-stats">
                <div className="contribution-count">
                    <strong>{pullRequestCount}</strong>

                    <span>
                        {t('openSource.pullRequestCount', {count: pullRequestCount})}
                    </span>
                </div>

                {hasPullRequests ? (
                    <div className="contribution-latest">
                        <span className="contribution-label">
                            {t('openSource.latestPr')}
                        </span>

                        <h4>
                            #{latestPullRequest.number}{' '}
                            {latestPullRequest.title}
                        </h4>

                        <span className="contribution-meta">
                            {formatDate(
                                latestPullRequest.created_at,
                                i18n.language,
                            )}
                            {' · '}
                            {t(`openSource.status.${getPullRequestStatusKey(latestPullRequest)}`)}
                        </span>
                    </div>
                ) : (
                    <div className="contribution-latest">
                        <span className="contribution-label">
                            {t('openSource.contributionsLabel')}
                        </span>

                        <p>
                            {t('openSource.noContributions')}
                        </p>
                    </div>
                )}
            </div>
        </motion.a>
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

                const results = await Promise.all(projects.map(loadProject));

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
            <div className="section-title">
                <h1>{t('openSource.title')}</h1>
            </div>

            <motion.p
                className="open-source-intro"
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: false, amount: 0.5}}
                transition={{duration: 0.8}}
            >
                <Trans i18nKey="openSource.intro">
                    I am an <strong className="accent">official committer of Apache Syncope</strong> at
                    the Apache Software Foundation, where I contribute to new features, code
                    improvements, and project quality.
                </Trans>
            </motion.p>

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
    );
};

export default OpenSource;
