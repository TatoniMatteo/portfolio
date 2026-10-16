// Share requests across components and StrictMode mounts. Persistent data is
// optional: browsers that block storage can still load the portfolio.
const CACHE_PREFIX = 'portfolio-github-v1:';
const FRESH_MS = 60 * 60 * 1000;
const STALE_MS = 7 * 24 * FRESH_MS;
const pending = new Map<string, Promise<unknown>>();

export async function githubJSON<T>(path: string, validate: (value: unknown) => value is T): Promise<T> {
    const key = CACHE_PREFIX + path;
    let cached: {data: T; savedAt: number} | undefined;
    try {
        const entry: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (isRecord(entry) && typeof entry.savedAt === 'number' && validate(entry.data)) {
            cached = {data: entry.data, savedAt: entry.savedAt};
        }
    } catch { /* Storage is unavailable or contains invalid data. */ }
    const age = cached ? Date.now() - cached.savedAt : Infinity;
    if (cached && age >= 0 && age < FRESH_MS) return cached.data;

    const existing = pending.get(path);
    if (existing) {
        const data = await existing;
        if (validate(data)) return data;
        throw new Error('Unexpected shared GitHub API response');
    }

    const request = (async () => {
        try {
            const response = await fetch(`https://api.github.com${path}`, {
                headers: {Accept: 'application/vnd.github+json'},
                signal: AbortSignal.timeout(8000),
            });
            if (!response.ok) throw new Error(`GitHub API ${response.status}`);
            const data: unknown = await response.json();
            if (!validate(data)) throw new Error('Unexpected GitHub API response');
            try { localStorage.setItem(key, JSON.stringify({data, savedAt: Date.now()})); }
            catch { /* Cache writes must not prevent rendering. */ }
            return data;
        } catch (error) {
            if (cached && age >= 0 && age < STALE_MS) return cached.data;
            throw error;
        } finally {
            pending.delete(path);
        }
    })();
    pending.set(path, request);
    return request;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export interface GitHubSearchItem {
    number: number;
    title: string;
    state: 'open' | 'closed';
    created_at: string;
    pull_request: {merged_at?: string | null};
}

export function pullRequestStatus(pr: GitHubSearchItem): 'merged' | 'open' | 'closed' {
    return pr.pull_request.merged_at ? 'merged' : pr.state;
}

export interface GitHubSearchResponse {
    total_count: number;
    incomplete_results: boolean;
    items: GitHubSearchItem[];
}

export const isSearchResponse = (value: unknown): value is GitHubSearchResponse =>
    isRecord(value) && typeof value.total_count === 'number' && value.total_count >= 0 &&
    value.incomplete_results === false && Array.isArray(value.items) && value.items.every((item: unknown) =>
        isRecord(item) && typeof item.number === 'number' && typeof item.title === 'string' &&
        (item.state === 'open' || item.state === 'closed') && typeof item.created_at === 'string' &&
        Number.isFinite(Date.parse(item.created_at)) && isRecord(item.pull_request) &&
        (item.pull_request.merged_at == null || typeof item.pull_request.merged_at === 'string'));
