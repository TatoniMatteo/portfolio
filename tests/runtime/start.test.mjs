import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {copyFile, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {setTimeout as delay} from 'node:timers/promises';

const fixture = async (t, {missingCaddy = false, ignoreTerm = ''} = {}) => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-runtime-'));
    await copyFile(new URL('../../docker/start.mjs', import.meta.url), join(directory, 'start.mjs'));
    await writeFile(join(directory, 'package.json'), '{"type":"module"}');
    for (const service of ['web', 'updater']) {
        const filename = service === 'web' ? 'caddy' : 'fetch-cv.mjs';
        await writeFile(join(directory, filename), `#!${process.execPath}
import {existsSync} from 'node:fs';
console.log('${service}-started');
console.log('${service}-credential:' + (process.env.CV_REPO_TOKEN ?? 'none'));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
    if (signal === 'SIGTERM' && process.env.FIXTURE_IGNORE_TERM === '${service}') return;
    console.log('${service}-stopped');
    process.exit(0);
});
setInterval(() => {
    if (existsSync(new URL('./crash-${service}', import.meta.url))) process.exit(${service === 'web' ? 42 : 43});
}, 10);
`, {mode: 0o755});
    }
    if (missingCaddy) await rm(join(directory, 'caddy'));
    const child = spawn(process.execPath, [join(directory, 'start.mjs')], {
        detached: true,
        env: {...process.env, PATH: directory, CV_REPO_TOKEN: 'fixture-token', FIXTURE_IGNORE_TERM: ignoreTerm},
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (data) => { output += data; });
    child.stderr.on('data', (data) => { output += data; });
    const closed = once(child, 'close');
    t.after(async () => {
        try { process.kill(-child.pid, 'SIGKILL'); } catch (error) {
            if (error.code !== 'ESRCH') throw error;
        }
        await closed;
        await rm(directory, {recursive: true, force: true});
    });
    const ready = async () => {
        const deadline = Date.now() + 3_000;
        while (!output.includes('web-started') || !output.includes('updater-started')) {
            assert.ok(Date.now() < deadline, output);
            await delay(10);
        }
    };
    return {child, closed, ready, output: () => output,
        crash: (service) => writeFile(join(directory, `crash-${service}`), '')};
};

for (const signal of ['SIGTERM', 'SIGINT']) {
    test(`starts both processes and forwards ${signal} for a clean shutdown`, {timeout: 5_000}, async (t) => {
        const runtime = await fixture(t);
        await runtime.ready();
        assert.match(runtime.output(), /web-credential:none/);
        assert.match(runtime.output(), /updater-credential:fixture-token/);
        runtime.child.kill(signal);
        const [code, exitSignal] = await runtime.closed;
        assert.equal(code, 0, runtime.output());
        assert.equal(exitSignal, null);
        assert.match(runtime.output(), /web-stopped/);
        assert.match(runtime.output(), /updater-stopped/);
    });
}

for (const service of ['web', 'updater']) {
    test(`stops the sibling and reports failure when ${service} crashes`, {timeout: 5_000}, async (t) => {
        const runtime = await fixture(t);
        await runtime.ready();
        await runtime.crash(service);
        const [code] = await runtime.closed;
        assert.equal(code, service === 'web' ? 42 : 43, runtime.output());
        assert.match(runtime.output(), new RegExp(`${service === 'web' ? 'updater' : 'web'}-stopped`));
    });
}

test('a missing Caddy executable fails without leaving the updater running', {timeout: 5_000}, async (t) => {
    const runtime = await fixture(t, {missingCaddy: true});
    const [code] = await runtime.closed;
    assert.equal(code, 1, runtime.output());
    assert.match(runtime.output(), /ENOENT/);
});

test('forces shutdown when a child ignores SIGTERM', {timeout: 12_000}, async (t) => {
    const runtime = await fixture(t, {ignoreTerm: 'web'});
    await runtime.ready();
    runtime.child.kill('SIGTERM');
    const [code, signal] = await runtime.closed;
    assert.equal(code, 0, runtime.output());
    assert.equal(signal, null);
    assert.match(runtime.output(), /updater-stopped/);
});
