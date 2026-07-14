import { spawn } from 'child_process';

import { env } from '../../../config/env.js';

const imageByLanguage = {
  java: env.judgeImageJava,
  python: env.judgeImagePython,
  c: env.judgeImageCpp,
  cpp: env.judgeImageCpp,
  javascript: env.judgeImageJavascript,
};

const trimOutput = (value = '', maxSize = 64 * 1024) => {
  if (value.length <= maxSize) return value;
  return `${value.slice(0, maxSize)}\n\n[output truncated]`;
};

export const runInDocker = ({ language, workspacePath, compileCommand = '', runCommand, timeoutMs = env.judgeTimeoutMs }) => new Promise((resolve) => {
  const image = imageByLanguage[language];
  if (!image) {
    resolve({ code: 1, stdout: '', stderr: `No Docker image configured for language: ${language}`, durationMs: 0, timedOut: false, memoryMb: 0 });
    return;
  }

  const startedAt = Date.now();
  const shellCommand = [compileCommand, runCommand].filter(Boolean).join(' && ');
  const args = [
    'run', '--rm',
    '--network', 'none',
    '--cpus', env.judgeCpuCount,
    '--memory', `${env.judgeMemoryMb}m`,
    '--pids-limit', '64',
    '--read-only',
    '--tmpfs', `/tmp:rw,noexec,nosuid,size=${env.judgeTmpFsMb}m`,
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    '--user', '10001:10001',
    '-v', `${workspacePath}:/workspace:rw`,
    '-w', '/workspace',
    image,
    'sh', '-lc', `${shellCommand}`,
  ];

  const child = spawn('docker', args, {
    shell: false,
    windowsHide: true,
  });

  let stdout = '';
  let stderr = '';
  let settled = false;
  let timedOut = false;

  const finalize = (payload) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolve({
      ...payload,
      stdout: trimOutput(payload.stdout || ''),
      stderr: trimOutput(payload.stderr || ''),
      durationMs: Date.now() - startedAt,
      memoryMb: payload.memoryMb || 0,
    });
  };

  const timer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGKILL');
  }, timeoutMs);

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', (error) => {
    finalize({ code: 1, stdout, stderr: `${stderr}${stderr ? '\n' : ''}${error.message}`, timedOut: false });
  });

  child.on('close', (code) => {
    if (timedOut) {
      finalize({ code: 124, stdout, stderr: `${stderr}${stderr ? '\n' : ''}Execution timed out after ${timeoutMs}ms.`, timedOut: true });
      return;
    }

    const memoryMatch = stderr.match(/Maximum resident set size \(kbytes\):\s*(\d+)/i);
    const memoryMb = memoryMatch ? Number.parseInt(memoryMatch[1], 10) / 1024 : 0;
    finalize({ code: code ?? 1, stdout, stderr, timedOut: false, memoryMb });
  });
});