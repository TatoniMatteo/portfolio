import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';

const fixture = async (t) => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-cv-selection-'));
    t.after(() => rm(directory, {recursive: true, force: true}));
    const downloads = [];
    let api;
    const assets = [
        'CV-Matteo-Tatoni-EN-ATS.pdf',
        'CV-Matteo-Tatoni-EN.pdf',
        'CV-Matteo-Tatoni-IT-ATS.pdf',
        'CV-Matteo-Tatoni-IT.pdf',
    ].map((name, index) => ({id: index + 1, name}));
    const server = createServer((req, res) => {
        if (req.url === '/repos/owner/CV/releases/latest') {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({tag_name: 'v1', assets: assets.map((asset) => ({...asset, url: `${api}/assets/${asset.id}`}))}));
        }
        const asset = assets.find((item) => req.url === `/assets/${item.id}`);
        if (asset) {
            downloads.push(asset.name);
            return res.end(`%PDF-1.7\n${asset.name}`);
        }
        res.writeHead(404);
        return res.end();
    });
    t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    api = `http://127.0.0.1:${server.address().port}`;
    const run = async (env = {}) => {
        const child = spawn(process.execPath, ['scripts/fetch-cv.mjs'], {env: {
            ...process.env, CI: 'true', CV_WATCH: 'false', CV_APP_ID: '', CV_APP_PRIVATE_KEY_FILE: '',
            CV_REPO_TOKEN: 'fixture-token', CV_REPO: 'owner/CV', GITHUB_API_URL: api,
            CV_OUT_DIR: directory, CV_IT_FILENAME: '', CV_EN_FILENAME: '', ...env,
        }});
        let logs = '';
        child.stdout.on('data', (chunk) => { logs += chunk; });
        child.stderr.on('data', (chunk) => { logs += chunk; });
        const [code] = await once(child, 'close');
        return {code, logs};
    };
    return {directory, assets, downloads, run};
};

test('replaces cached ATS PDFs from the same release and then skips unchanged standard PDFs', async (t) => {
    const {directory, downloads, run} = await fixture(t);
    const metadata = {signature: {tag: 'v1', assets: {it: '3::', en: '1::'}}};
    await writeFile(join(directory, '.cv-meta.json'), JSON.stringify(metadata));
    for (const lang of ['it', 'en']) await writeFile(join(directory, `cv-${lang}.pdf`), '%PDF-1.7\nold ATS');

    const first = await run();
    assert.equal(first.code, 0, first.logs);
    assert.deepEqual(downloads, ['CV-Matteo-Tatoni-IT.pdf', 'CV-Matteo-Tatoni-EN.pdf']);
    for (const lang of ['it', 'en']) {
        assert.equal(await readFile(join(directory, `cv-${lang}.pdf`), 'utf8'), `%PDF-1.7\nCV-Matteo-Tatoni-${lang.toUpperCase()}.pdf`);
    }
    const second = await run();
    assert.equal(second.code, 0, second.logs);
    assert.match(second.logs, /già aggiornato/);
    assert.equal(downloads.length, 2);
});

test('matches configured filenames exactly and refreshes when the selection changes', async (t) => {
    const {assets, downloads, run} = await fixture(t);
    const initial = await run();
    assert.equal(initial.code, 0, initial.logs);
    assets.push({id: 5, name: 'Curriculum Italiano.pdf'}, {id: 6, name: 'Resume English.pdf'});
    const env = {CV_IT_FILENAME: 'Curriculum Italiano.pdf', CV_EN_FILENAME: 'Resume English.pdf'};
    const custom = await run(env);
    assert.equal(custom.code, 0, custom.logs);
    assert.deepEqual(downloads.slice(2), ['Curriculum Italiano.pdf', 'Resume English.pdf']);
    const mismatch = await run({...env, CV_IT_FILENAME: 'curriculum italiano.pdf'});
    assert.equal(mismatch.code, 1, mismatch.logs);
    assert.match(mismatch.logs, /PDF mancanti: curriculum italiano\.pdf/);
    assert.equal(downloads.length, 4);
});

test('rejects ATS even when explicitly configured', async (t) => {
    const {downloads, run} = await fixture(t);
    const result = await run({CV_IT_FILENAME: 'CV-Matteo-Tatoni-IT-ATS.pdf'});
    assert.equal(result.code, 1, result.logs);
    assert.match(result.logs, /PDF mancanti: CV-Matteo-Tatoni-IT-ATS\.pdf/);
    assert.deepEqual(downloads, []);
});

test('fails without downloading ATS or replacing existing PDFs when a standard language is missing', async (t) => {
    const {directory, assets, downloads, run} = await fixture(t);
    assets.splice(assets.findIndex((asset) => asset.name === 'CV-Matteo-Tatoni-IT.pdf'), 1);
    assets.push({id: 5, name: 'CV-IT.pdf'});
    for (const lang of ['it', 'en']) await writeFile(join(directory, `cv-${lang}.pdf`), '%PDF-1.7\nexisting');
    const result = await run();
    assert.equal(result.code, 1, result.logs);
    assert.match(result.logs, /PDF mancanti: CV-Matteo-Tatoni-IT\.pdf/);
    assert.deepEqual(downloads, []);
    for (const lang of ['it', 'en']) assert.equal(await readFile(join(directory, `cv-${lang}.pdf`), 'utf8'), '%PDF-1.7\nexisting');
});
