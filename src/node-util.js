import { spawn } from 'node:child_process';

export function runCommand(cmd, args = []) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: 'inherit' });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command exited with code ${code}`));
            }
        });

        child.on('error', reject);
    });
}