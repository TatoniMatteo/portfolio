import {execFileSync} from 'node:child_process';
import {createPrivateKey, sign} from 'node:crypto';
import {readFile} from 'node:fs/promises';

// A sync can run days after the preceding one: check expiry on each request.
// Installation tokens stay in memory and are scoped to the CV repository.
export const createTokenProvider = ({env = process.env, fetchImpl = fetch, now = Date.now} = {}) => {
    let cached;
    let installationId;
    const appId = env.CV_APP_ID;
    const keyFile = env.CV_APP_PRIVATE_KEY_FILE;
    const repo = env.CV_REPO ?? 'TatoniMatteo/CV';
    const api = (env.GITHUB_API_URL ?? 'https://api.github.com').replace(/\/$/, '');

    const request = async (path, jwt, body) => {
        const response = await fetchImpl(`${api}${path}`, {
            method: body ? 'POST' : 'GET',
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${jwt}`,
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'portfolio-fetch-cv',
            },
            ...(body ? {body: JSON.stringify(body)} : {}),
            signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`Autenticazione GitHub App: HTTP ${response.status}. Verifica installazione e permesso Contents: read su ${repo}.`);
        return response.json();
    };

    return async () => {
        if (appId || keyFile) {
            if (!appId || !keyFile) throw new Error('Configura sia CV_APP_ID sia CV_APP_PRIVATE_KEY_FILE per usare la GitHub App.');
            if (cached && cached.expiresAt > now() + 60_000) return cached.token;
            const [owner, name, extra] = repo.split('/');
            if (!owner || !name || extra !== undefined) throw new Error('CV_REPO deve avere il formato proprietario/repository.');
            // Re-read on renewal; container file mounts must also expose the new key.
            const key = createPrivateKey(await readFile(keyFile));
            if (key.asymmetricKeyType !== 'rsa') throw new Error('La chiave della GitHub App deve essere RSA.');
            const seconds = Math.floor(now() / 1000);
            const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
            const payload = `${encode({alg: 'RS256', typ: 'JWT'})}.${encode({iss: appId, iat: seconds - 60, exp: seconds + 540})}`;
            const jwt = `${payload}.${sign('RSA-SHA256', Buffer.from(payload), key).toString('base64url')}`;
            if (!installationId) {
                const installation = await request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/installation`, jwt);
                if (!Number.isSafeInteger(installation.id) || installation.id <= 0) throw new Error('ID installazione GitHub App non valido.');
                installationId = installation.id;
            }
            const result = await request(`/app/installations/${installationId}/access_tokens`, jwt, {
                repositories: [name], permissions: {contents: 'read'},
            });
            const expiresAt = Date.parse(result.expires_at);
            if (typeof result.token !== 'string' || !result.token || !Number.isFinite(expiresAt) || expiresAt <= now() + 60_000) {
                throw new Error('Token di installazione GitHub App assente o già scaduto.');
            }
            cached = {token: result.token, expiresAt};
            return cached.token;
        }

        const fromEnv = env.CV_REPO_TOKEN || env.GITHUB_TOKEN;
        if (fromEnv) return fromEnv;
        try {
            return execFileSync('gh', ['auth', 'token'], {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim() || null;
        } catch {
            return null;
        }
    };
};
