import {githubJSON, isRecord, isSearchResponse} from './github';
import type {GitHubSearchItem, GitHubSearchResponse} from './github';

export interface OpenSourceProject {
    owner: string;
    repo: string;
}

interface ContributionSearchResponse extends GitHubSearchResponse {
    items: (GitHubSearchItem & {repository_url: string})[];
}

const repositoryPattern = /^https:\/\/api\.github\.com\/repos\/([\w.-]+)\/([\w.-]+)$/;
const isContributionSearch = (value: unknown): value is ContributionSearchResponse =>
    isSearchResponse(value) && value.items.every((item) =>
        isRecord(item) && typeof item.repository_url === 'string' && repositoryPattern.test(item.repository_url));

// Paginate all PRs, splitting large searches by date to respect GitHub's
// 1,000-result search limit without losing older projects.
export async function discoverOpenSourceProjects(username: string): Promise<OpenSourceProject[]> {
    const projects = new Map<string, OpenSourceProject>();
    const query = `type:pr author:${username} is:public -user:${username}`;
    const dayMs = 86_400_000;
    const date = (day: number) => new Date(day * dayMs).toISOString().slice(0, 10);
    const collect = async (from: number, to: number, range = ''): Promise<void> => {
        const search = encodeURIComponent(query + range);
        const pagePath = (page: number) => `/search/issues?q=${search}&sort=created&order=desc&per_page=100&page=${page}`;
        const first = await githubJSON(pagePath(1), isContributionSearch);
        if (first.total_count > 1000) {
            if (from >= to) throw new Error('Too many contributions in a single day');
            const middle = Math.floor((from + to) / 2);
            await collect(middle + 1, to, ` created:${date(middle + 1)}..${date(to)}`);
            await collect(from, middle, ` created:${date(from)}..${date(middle)}`);
            return;
        }
        const add = (items: ContributionSearchResponse['items']) => {
            for (const item of items) {
                const [, owner, repo] = item.repository_url.match(repositoryPattern)!;
                if (owner.toLowerCase() !== username.toLowerCase()) {
                    projects.set(`${owner}/${repo}`.toLowerCase(), {owner, repo});
                }
            }
        };
        add(first.items);
        for (let page = 2; page <= Math.ceil(first.total_count / 100); page++) {
            const next = await githubJSON(pagePath(page), isContributionSearch);
            if (next.items.length === 0) throw new Error('Incomplete contribution search');
            add(next.items);
        }
    };
    await collect(Math.floor(Date.UTC(2008, 0, 1) / dayMs), Math.floor(Date.now() / dayMs));
    return [...projects.values()];
}
