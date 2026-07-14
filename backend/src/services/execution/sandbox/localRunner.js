import { spawn } from 'child_process';

import { env } from '../../../config/env.js';

/**
 * Local process runner — executes compile + run commands directly
 * using child_process.spawn instead of Docker containers.
 *
 * The wrapper builders (java, python, cpp, javascript) return shell
 * command strings like "javac Main.java" and "java -cp . Main".
 * This runner parses those strings and spawns the processes locally.
 */

const MAX_OUTPUT_SIZE = 64 * 1024;

const trimOutput = (value = '', maxSize = MAX_OUTPUT_SIZE) => {
  if (value.length <= maxSize) return value;
  return `${value.slice(0, maxSize)}\n\n[output truncated]`;
};

/**
 * Parse a shell command string into { command, args }.
 * e.g. "javac Main.java" => { command: "javac", args: ["Main.java"] }
 * e.g. "java -cp . Main"  => { command: "java", args: ["-cp", ".", "Main"] }
 * e.g. "./main"            => { command: "./main", args: [] }
 *
 * On Windows, adjusts Unix-style paths for local execution.
 */
const parseShellCommand = (shellCommand) => {
  const parts = String(shellCommand || '').trim().split(/\s+/);
  let command = parts[0] || '';
  const args = parts.slice(1);

  // On Windows, adjust Unix-style executable paths
  if (process.platform === 'win32') {
    if (command === './main') {
      command = 'main.exe';
    } else if (command === './main.exe') {
      command = 'main.exe';
    }

    // Adjust compile output for Windows: "-o main" → "-o main.exe"
    const oFlagIndex = args.indexOf('-o');
    if (oFlagIndex !== -1 && oFlagIndex + 1 < args.length) {
      const outputName = args[oFlagIndex + 1];
      if (outputName === 'main' && !outputName.includes('.')) {
        args[oFlagIndex + 1] = 'main.exe';
      }
    }
  }

  return { command, args };
};

/**
 * Spawn a single process and capture its output.
 */
const runProcess = ({ command, args, cwd, timeoutMs }) => new Promise((resolve) => {
  const startedAt = Date.now();
  const child = spawn(command, args, {
    cwd,
    shell: false,
    windowsHide: true,
  });

  let stdout = '';
  let stderr = '';
  let killedByTimeout = false;
  let settled = false;

  const finalize = (result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolve({
      ...result,
      stdout: trimOutput(result.stdout || ''),
      stderr: trimOutput(result.stderr || ''),
      durationMs: Date.now() - startedAt,
    });
  };

  const timer = setTimeout(() => {
    killedByTimeout = true;
    child.kill('SIGKILL');
  }, timeoutMs);

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', (error) => {
    let errorMsg = error.message;
    if (error.code === 'ENOENT') {
      errorMsg = `${command} is not installed or not available in PATH. Please install it to run ${command === 'javac' || command === 'java' ? 'Java' : command === 'python' ? 'Python' : command === 'g++' || command === 'gcc' ? 'C/C++' : command} code.`;
    }
    finalize({
      code: 1,
      stdout,
      stderr: `${stderr}${stderr ? '\n' : ''}${errorMsg}`,
      timedOut: false,
    });
  });

  child.on('close', (code) => {
    if (killedByTimeout) {
      finalize({
        code: 124,
        stdout,
        stderr: `${stderr}${stderr ? '\n' : ''}Execution timed out after ${timeoutMs}ms.`,
        timedOut: true,
      });
      return;
    }

    finalize({
      code: code ?? 1,
      stdout,
      stderr,
      timedOut: false,
    });
  });
});

/**
 * Run code locally using child_process.spawn.
 * Mirrors the same interface as runInDocker so the orchestrator
 * can swap between them without changes.
 *
 * @param {Object} options
 * @param {string} options.language       - Language identifier
 * @param {string} options.workspacePath  - Temp directory with source file
 * @param {string} options.compileCommand - Shell command to compile (can be empty)
 * @param {string} options.runCommand     - Shell command to run the program
 * @param {number} [options.timeoutMs]    - Per-step timeout
 * @returns {Promise<{code, stdout, stderr, durationMs, timedOut, memoryMb}>}
 */
export const runLocally = async ({ language, workspacePath, compileCommand = '', runCommand, timeoutMs = env.judgeTimeoutMs }) => {
  let totalDurationMs = 0;

  // ── Step 1: Compile (if needed) ──────────────────────────────────────
  if (compileCommand) {
    const { command, args } = parseShellCommand(compileCommand);
    const compileResult = await runProcess({
      command,
      args,
      cwd: workspacePath,
      timeoutMs,
    });

    totalDurationMs += compileResult.durationMs;

    if (compileResult.code !== 0) {
      return {
        code: compileResult.code,
        stdout: compileResult.stdout,
        stderr: compileResult.stderr,
        durationMs: totalDurationMs,
        timedOut: compileResult.timedOut,
        memoryMb: 0,
      };
    }
  }

  // ── Step 2: Run ──────────────────────────────────────────────────────
  const { command, args } = parseShellCommand(runCommand);
  const runResult = await runProcess({
    command,
    args,
    cwd: workspacePath,
    timeoutMs,
  });

  totalDurationMs += runResult.durationMs;

  // Try to parse memory from stderr if available (Linux /usr/bin/time format)
  const memoryMatch = String(runResult.stderr || '').match(/Maximum resident set size \(kbytes\):\s*(\d+)/i);
  const memoryMb = memoryMatch ? Number.parseInt(memoryMatch[1], 10) / 1024 : 0;

  return {
    code: runResult.code,
    stdout: runResult.stdout,
    stderr: runResult.stderr,
    durationMs: totalDurationMs,
    timedOut: runResult.timedOut,
    memoryMb,
  };
};
