import assert from 'node:assert/strict';
import {generateKeyPairSync, verify} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {test} from 'node:test';
import {createTokenProvider} from '../../scripts/github-auth.mjs';

const pair = generateKeyPairSync('rsa', {modulusLength: 2048});
const pem = pair.privateKey.export({type: 'pkcs1', format: 'pem'});
const fixture = async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-cv-auth-'));
    t.after(() => rm(directory, {recursive: true, force: true}));
    const keyFile = join(directory, 'app.pem');
    await writeFile(keyFile, pem, {mode: 0o600});
    return {directory, env: {CV_APP_ID: 'Iv1.test-app', CV_APP_PRIVATE_KEY_FILE: keyFile, CV_REPO: 'owner/CV'}};
};
const response = (body, status = 200) => Response.json(body, {status});

test('signs an RS256 JWT, restricts permissions and renews after days without requests', async (t) => {
    const {env} = await fixture(t);
    let clock = Date.parse('2026-10-16T12:00:00Z');
    const calls = [];
    let minted = 0;
    const getToken = createTokenProvider({env, now: () => clock, fetchImpl: async (url, options) => {
        calls.push({url, options});
        const jwt = options.headers.Authorization.slice('Bearer '.length);
        const [header, payload, signature] = jwt.split('.');
        assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url')), {alg: 'RS256', typ: 'JWT'});
        const claims = JSON.parse(Buffer.from(payload, 'base64url'));
        assert.equal(claims.iss, env.CV_APP_ID);
        assert.equal(claims.iat, clock / 1000 - 60);
        assert.ok(claims.exp > clock / 1000 && claims.exp <= clock / 1000 + 600);
        assert.ok(verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), pair.publicKey, Buffer.from(signature, 'base64url')));
        if (options.method === 'GET') {
            assert.equal(url, 'https://api.github.com/repos/owner/CV/installation');
            return response({id: 123});
        }
        assert.equal(url, 'https://api.github.com/app/installations/123/access_tokens');
        assert.deepEqual(JSON.parse(options.body), {repositories: ['CV'], permissions: {contents: 'read'}});
        return response({token: `installation-${++minted}`, expires_at: new Date(clock + 3_600_000).toISOString()});
    }});
    assert.equal(await getToken(), 'installation-1');
    assert.equal(await getToken(), 'installation-1');
    assert.equal(calls.length, 2);
    clock += 2 * 24 * 3_600_000;
    assert.equal(await getToken(), 'installation-2');
    assert.equal(calls.length, 3);
    // Refresh before expiry, not after the first rejected download request.
    clock += 3_600_000 - 30_000;
    assert.equal(await getToken(), 'installation-3');
});

test('PAT and GITHUB_TOKEN remain usable without App configuration', async () => {
    const fetchImpl = () => assert.fail('PAT authentication must not request an App token');
    assert.equal(await createTokenProvider({env: {CV_REPO_TOKEN: 'pat', GITHUB_TOKEN: 'fallback'}, fetchImpl})(), 'pat');
    assert.equal(await createTokenProvider({env: {GITHUB_TOKEN: 'fallback'}, fetchImpl})(), 'fallback');
});

test('incomplete App configuration fails explicitly instead of silently using a PAT', async () => {
    await assert.rejects(createTokenProvider({env: {CV_APP_ID: '123', CV_REPO_TOKEN: 'pat'}})(), /CV_APP_PRIVATE_KEY_FILE/);
    await assert.rejects(createTokenProvider({env: {CV_APP_PRIVATE_KEY_FILE: '/unused'}})(), /CV_APP_ID/);
});

test('authentication failures never include response bodies or JWTs in errors', async (t) => {
    const {env} = await fixture(t);
    const getToken = createTokenProvider({env, fetchImpl: async () => response({message: 'secret-response-body'}, 403)});
    await assert.rejects(getToken(), (error) => {
        assert.match(error.message, /HTTP 403/);
        assert.doesNotMatch(error.message, /secret-response-body|Bearer|eyJ/);
        return true;
    });
});

test('expired or malformed installation tokens are rejected and a later attempt can recover', async (t) => {
    const {env} = await fixture(t);
    let valid = false;
    const getToken = createTokenProvider({env, fetchImpl: async (_url, options) => {
        if (options.method === 'GET') return response({id: 123});
        return response({token: 'installation', expires_at: valid ? new Date(Date.now() + 3_600_000).toISOString() : 'invalid'});
    }});
    await assert.rejects(getToken(), /assente o già scaduto/);
    valid = true;
    assert.equal(await getToken(), 'installation');
});

test('missing key files fail before contacting GitHub', async (t) => {
    const {env} = await fixture(t);
    await rm(env.CV_APP_PRIVATE_KEY_FILE);
    const getToken = createTokenProvider({env, fetchImpl: () => assert.fail('No request without a key')});
    await assert.rejects(getToken(), {code: 'ENOENT'});
});

test('the updater downloads private release assets with an App token and persists no credentials', async (t) => {
    const {directory, env} = await fixture(t);
    const calls = [];
    let api;
    const server = createServer((req, res) => {
        calls.push(req.url);
        const json = (value) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
        if (req.url === '/repos/owner/CV/installation') return json({id: 123});
        if (req.url === '/app/installations/123/access_tokens') return json({token: 'test-installation-token', expires_at: new Date(Date.now() + 3_600_000).toISOString()});
        if (req.headers.authorization !== 'Bearer test-installation-token') { res.writeHead(401); return res.end(); }
        if (req.url === '/repos/owner/CV/releases/latest') return json({tag_name: 'v1', assets: ['it', 'en'].map((lang, index) => ({id: index + 1, name: `CV-${lang}.pdf`, url: `${api}/assets/${lang}`}))});
        if (req.url?.startsWith('/assets/')) return res.end(`%PDF-1.7\n${req.url}`);
        res.writeHead(404); return res.end();
    });
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    api = `http://127.0.0.1:${server.address().port}`;
    const output = join(directory, 'cv');
    const child = spawn(process.execPath, ['scripts/fetch-cv.mjs'], {env: {...process.env, ...env, CI: 'true', CV_WATCH: 'false', CV_REPO_TOKEN: '', GITHUB_TOKEN: '', GITHUB_API_URL: api, CV_OUT_DIR: output}});
    let logs = '';
    child.stdout.on('data', (chunk) => { logs += chunk; });
    child.stderr.on('data', (chunk) => { logs += chunk; });
    const [code] = await once(child, 'close');
    assert.equal(code, 0, logs);
    assert.equal(calls.length, 5);
    for (const lang of ['it', 'en']) assert.match(await readFile(join(output, `cv-${lang}.pdf`), 'utf8'), /^%PDF/);
    assert.doesNotMatch(logs + await readFile(join(output, '.cv-meta.json'), 'utf8'), /test-installation-token|PRIVATE KEY|Bearer/);
});
