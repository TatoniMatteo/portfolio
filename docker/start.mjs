import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const children = new Set();
let stopping = false;
let exitCode = 0;
let deadline;

const finish = () => {
    if (stopping && children.size === 0) {
        clearTimeout(deadline);
        process.exitCode = exitCode;
    }
};

const stop = (code, signal = 'SIGTERM') => {
    if (stopping) return;
    stopping = true;
    exitCode = code;
    for (const child of children) child.kill(signal);
    deadline = setTimeout(() => {
        for (const child of children) child.kill('SIGKILL');
    }, 8_000);
    deadline.unref();
    finish();
};

const start = (name, command, args, env = process.env) => {
    const child = spawn(command, args, {stdio: 'inherit', env});
    children.add(child);
    child.once('spawn', () => console.log(`[runtime] ${name} avviato (PID ${child.pid}).`));
    child.once('error', (error) => {
        console.error(`[runtime] ${name}: ${error.message}`);
        stop(1);
    });
    child.once('close', (code, signal) => {
        children.delete(child);
        if (!stopping) {
            console.error(`[runtime] ${name} terminato (${signal ?? code}); arresto del container.`);
            stop(code > 0 ? code : 1);
        }
        finish();
    });
};

for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => stop(0, signal));
}

// Caddy does not need the updater's GitHub configuration in its environment.
const webEnv = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.startsWith('CV_') && !key.startsWith('GITHUB_')));

start('Caddy', 'caddy', ['run', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile'], webEnv);
start('CV updater', process.execPath, [fileURLToPath(new URL('./fetch-cv.mjs', import.meta.url)), '--watch']);
