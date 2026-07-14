import crypto from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { env } from '../../config/env.js';
import CodingQuestion from '../../models/codingQuestion.model.js';
import Submission from '../../models/submission.model.js';
import logger from '../../logger/index.js';
import { compareOutputs } from './comparator/index.js';
import { resolveParameterValues } from './parser/index.js';
import { runInDocker } from './sandbox/dockerRunner.js';
import { runLocally } from './sandbox/localRunner.js';
import { buildCppWrapper } from './wrapper/cpp.wrapper.js';
import { buildJavaWrapper } from './wrapper/java.wrapper.js';
import { buildJavascriptWrapper } from './wrapper/javascript.wrapper.js';
import { buildPythonWrapper } from './wrapper/python.wrapper.js';

/** Pick execution backend based on JUDGE_USE_DOCKER env var */
const executeInSandbox = env.judgeUseDocker ? runInDocker : runLocally;

const wrapperBuilders = {
  java: buildJavaWrapper,
  python: buildPythonWrapper,
  c: buildCppWrapper,
  cpp: buildCppWrapper,
  javascript: buildJavascriptWrapper,
};

const methodRegexByLanguage = {
  java: /class\s+(\w+)[\s\S]*?public\s+(?:static\s+)?([\w<>\[\]]+)\s+(?!main\b)(\w+)\s*\(([^)]*)\)/m,
  python: /def\s+(\w+)\s*\(([^)]*)\):/m,
  javascript: /(?:var|let|const)\s+(\w+)\s*=\s*function\s*\(([^)]*)\)|function\s+(\w+)\s*\(([^)]*)\)|(?:class\s+\w+[\s\S]*?)?(\w+)\s*\(([^)]*)\)\s*\{/m,
  c: /([\w:<>\[\]]+)\s+(\w+)\s*\(([^)]*)\)\s*\{/m,
  cpp: /([\w:<>\[\]]+)\s+(\w+)\s*\(([^)]*)\)\s*\{/m,
};

const parseParameters = (rawParams = '') => String(rawParams)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .map((entry, index) => {
    const match = entry.match(/^(.+?)\s+(\w+)$/);
    if (!match) {
      const cleanName = entry.replace(/self\s*/, '').trim() || `arg${index}`;
      let guessedType = 'String';
      const lowered = cleanName.toLowerCase();
      if (lowered === 'root' || lowered === 'p' || lowered === 'q' || lowered.includes('tree')) guessedType = 'TreeNode';
      if (lowered === 'head' || lowered === 'list') guessedType = 'ListNode';
      return { name: cleanName, type: guessedType };
    }
    return { type: match[1].trim(), name: match[2].trim() };
  });

const detectExecutionProfile = ({ language, sourceCode }) => {
  const code = String(sourceCode || '');
  
  if (language === 'java' || language === 'c' || language === 'cpp') {
    // For Java: find all classes, then find public methods in the right class
    if (language === 'java') {
      const helperClassNames = new Set(['TreeNode', 'ListNode', 'Node']);
      const methodRegex = /public\s+(?:static\s+)?([\w<>\[\]]+)\s+(?!main\b)(\w+)\s*\(([^)]*)\)/g;
      const classRegex = /(?:public\s+)?class\s+(\w+)/g;
      
      // Find all class positions
      const classPositions = [];
      let cm;
      while ((cm = classRegex.exec(code)) !== null) {
        classPositions.push({ name: cm[1], index: cm.index });
      }
      
      // Find the owning class for each method match
      let bestMatch = null;
      let mm;
      while ((mm = methodRegex.exec(code)) !== null) {
        // Determine which class this method is inside of
        let ownerClass = 'Solution';
        for (let i = classPositions.length - 1; i >= 0; i--) {
          if (classPositions[i].index < mm.index) {
            ownerClass = classPositions[i].name;
            break;
          }
        }
        
        // Prefer methods NOT in helper classes
        if (!helperClassNames.has(ownerClass)) {
          bestMatch = { entryClass: ownerClass, returnType: mm[1], methodName: mm[2], rawParams: mm[3] };
          break; // Found one in a non-helper class, use it
        }
        
        // Otherwise keep looking but save as fallback
        if (!bestMatch) {
          bestMatch = { entryClass: ownerClass, returnType: mm[1], methodName: mm[2], rawParams: mm[3] };
        }
      }
      
      if (!bestMatch) return null;
      
      return {
        entryClass: bestMatch.entryClass,
        methodName: bestMatch.methodName,
        returnType: bestMatch.returnType || 'object',
        parameters: parseParameters(bestMatch.rawParams),
        comparator: { mode: 'ignore_whitespace' },
      };
    }
    
    // C/C++
    const regex = methodRegexByLanguage[language];
    const match = code.match(regex);
    if (!match) return null;
    const [, returnType, methodName, rawParams] = match;
    return {
      entryClass: 'Solution',
      methodName,
      returnType: returnType || 'object',
      parameters: parseParameters(rawParams),
      comparator: { mode: 'ignore_whitespace' },
    };
  }

  if (language === 'python' || language === 'javascript') {
    const regex = methodRegexByLanguage[language];
    const match = code.match(regex);
    if (!match) return null;
    const isJS = language === 'javascript';
    let methodName, rawParams;
    if (isJS) {
      methodName = match[1] || match[3] || match[5];
      rawParams = match[2] || match[4] || match[6];
      if (['if', 'while', 'for', 'switch', 'catch', 'return'].includes(methodName)) return null;
    } else {
      methodName = match[1];
      rawParams = match[2];
    }
    
    return {
      entryClass: 'Solution',
      methodName: methodName,
      returnType: 'object',
      parameters: String(rawParams)
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item && item !== 'self')
        .map((name) => {
          let guessedType = 'String';
          const lowered = name.toLowerCase();
          if (lowered === 'root' || lowered === 'p' || lowered === 'q' || lowered.includes('tree')) guessedType = 'TreeNode';
          if (lowered === 'head' || lowered === 'list') guessedType = 'ListNode';
          return { name, type: guessedType };
        }),
      comparator: { mode: 'ignore_whitespace' },
    };
  }

  return null;
};

const resolveExecutionProfile = ({ question, submission }) => {
  const language = submission.language;
  const fromQuestion = question?.execution?.[language];
  if (fromQuestion?.methodName) return fromQuestion;

  const detected = detectExecutionProfile({ language, sourceCode: submission.sourceCode });
  if (detected) return detected;

  throw new Error(`Execution metadata missing for language ${language} and automatic detection failed.`);
};

const buildRunCases = ({ submission, question }) => {
  // ── Run mode: execute against sample input only ──────────────────────────
  if (submission.mode === 'run') {
    return [{
      input: submission.customInput || question?.sampleInput || '',
      output: question?.sampleOutput || '',
      comparison: { mode: 'ignore_whitespace' },
      isRunMode: true,
    }];
  }

  // ── Submit mode: ALWAYS execute ALL test cases (visible + hidden) ─────────
  // The isHidden flag controls UI display ONLY, not execution.
  // Hidden cases must affect the final verdict — they are never skipped.
  const allCases = question?.testCases || [];

  if (allCases.length === 0) {
    throw new Error('No test cases configured for this problem. Please contact support.');
  }

  // Validate ID bounds — guard against corrupted sourceId data (>447)
  if (question?.sourceId != null && question.sourceId > 447) {
    throw new Error(`Invalid question sourceId ${question.sourceId}: exceeds maximum allowed value of 447.`);
  }

  // Return all cases; visible ones first, hidden ones last, for deterministic ordering
  const visibleCases = allCases.filter((tc) => !tc.isHidden);
  const hiddenCases  = allCases.filter((tc) =>  tc.isHidden);
  return [...visibleCases, ...hiddenCases];
};

const createWorkspace = async () => fs.mkdtemp(path.join(os.tmpdir(), 'careerprephub-judge-'));

const finalizeSubmission = async (submission, payload) => {
  submission.status = payload.status;
  submission.runtimeMs = payload.runtimeMs || 0;
  submission.memoryMb = payload.memoryMb || 0;
  submission.stdout = payload.stdout || '';
  submission.stderr = payload.stderr || '';
  submission.compileError = payload.compileError || '';
  submission.runtimeError = payload.runtimeError || '';
  submission.perTestResults = payload.perTestResults || [];
  
  if (payload.failedTestCase) submission.failedTestCase = payload.failedTestCase;
  if ('totalTests' in payload) submission.totalTests = payload.totalTests;
  if ('passedTests' in payload) submission.passedTests = payload.passedTests;
  
  submission.finishedAt = new Date();
  await submission.save();
  return submission;
};

export const judgeSubmissionById = async (submissionId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  const question = submission.problemId ? await CodingQuestion.findById(submission.problemId).lean() : null;
  const executionProfile = resolveExecutionProfile({ question, submission });
  
  const sampleOutStr = String(question?.sampleOutput || '').trim();
  const hasNodeParam = (executionProfile.parameters || []).some(p => p.type === 'TreeNode' || p.type === 'ListNode');
  const returnsNode = executionProfile.returnType === 'TreeNode' || executionProfile.returnType === 'ListNode';
  
  if ((returnsNode || hasNodeParam) && !sampleOutStr.startsWith('[')) {
    executionProfile.serializeNodeAsValue = true;
  }
  
  const wrapperBuilder = wrapperBuilders[submission.language];

  if (!wrapperBuilder) {
    return finalizeSubmission(submission, {
      status: 'System Error',
      runtimeError: `Unsupported language: ${submission.language}`,
    });
  }

  submission.status = 'RUNNING';
  submission.startedAt = new Date();
  await submission.save();

  const testCases = buildRunCases({ submission, question });
  const perTestResults = [];
  let totalRuntimeMs = 0;
  let peakMemoryMb = 0;

  for (let index = 0; index < testCases.length; index += 1) {
    const testCase = testCases[index];
    const workspace = await createWorkspace();
    try {
      const inputValues = resolveParameterValues({
        rawInput: testCase.input,
        parameters: executionProfile.parameters || [],
      });

      const wrapper = wrapperBuilder({
        userCode: submission.sourceCode,
        metadata: executionProfile,
        inputValues,
      });

      await fs.writeFile(path.join(workspace, wrapper.fileName), wrapper.sourceCode, 'utf8');

      const runResult = await executeInSandbox({
        language: submission.language,
        workspacePath: workspace,
        compileCommand: wrapper.compile,
        runCommand: wrapper.run,
      });

      totalRuntimeMs += runResult.durationMs || 0;
      peakMemoryMb = Math.max(peakMemoryMb, runResult.memoryMb || 0);

      if (runResult.code !== 0) {
        const status = runResult.timedOut
          ? 'Time Limit Exceeded'
          : (String(runResult.stderr || '').includes('error:') ? 'Compilation Error' : 'Runtime Error');

        // Hidden test cases must affect verdict but NEVER expose their data to the client
        const isHiddenCase = Boolean(testCase.isHidden);

        perTestResults.push({
          index: index + 1,
          status,
          runtimeMs: runResult.durationMs || 0,
          memoryMb: runResult.memoryMb || 0,
          stdout: isHiddenCase ? '' : runResult.stdout,
          stderr: isHiddenCase ? '' : runResult.stderr,
          input: isHiddenCase ? '[hidden]' : (testCase.input || ''),
        });

        return finalizeSubmission(submission, {
          status,
          runtimeMs: totalRuntimeMs,
          memoryMb: peakMemoryMb,
          stdout: isHiddenCase ? '' : runResult.stdout,
          stderr: isHiddenCase ? '' : runResult.stderr,
          compileError: status === 'Compilation Error' ? runResult.stderr : '',
          runtimeError: status === 'Runtime Error' || status === 'Time Limit Exceeded' ? runResult.stderr : '',
          perTestResults,
          failedTestCase: {
            index: index + 1,
            // Mask hidden test case details — execution is recorded, data is not exposed
            input: isHiddenCase ? '[hidden]' : (testCase.input || ''),
            expectedOutput: isHiddenCase ? '[hidden]' : (testCase.output || ''),
            actualOutput: isHiddenCase ? '[hidden]' : (runResult.stdout || ''),
          },
          totalTests: testCases.length,
          passedTests: index,
        });
      }

      if (submission.mode === 'submit') {
        const comparison = compareOutputs({
          actual: runResult.stdout,
          expected: testCase.output,
          comparison: executionProfile.comparator || testCase.comparison || { mode: 'ignore_whitespace' },
        });

        if (!comparison.passed) {
          // Hidden test cases affect the verdict but their I/O is never sent to the client
          const isHiddenCase = Boolean(testCase.isHidden);

          perTestResults.push({
            index: index + 1,
            status: 'Wrong Answer',
            runtimeMs: runResult.durationMs || 0,
            memoryMb: runResult.memoryMb || 0,
            stdout: isHiddenCase ? '' : runResult.stdout,
            stderr: isHiddenCase ? '' : runResult.stderr,
            input: isHiddenCase ? '[hidden]' : (testCase.input || ''),
          });

          return finalizeSubmission(submission, {
            status: 'Wrong Answer',
            runtimeMs: totalRuntimeMs,
            memoryMb: peakMemoryMb,
            stdout: isHiddenCase ? '' : runResult.stdout,
            stderr: isHiddenCase ? '' : runResult.stderr,
            perTestResults,
            failedTestCase: {
              index: index + 1,
              input: isHiddenCase ? '[hidden]' : (testCase.input || ''),
              expectedOutput: isHiddenCase ? '[hidden]' : (testCase.output || ''),
              actualOutput: isHiddenCase ? '[hidden]' : (runResult.stdout || ''),
            },
            totalTests: testCases.length,
            passedTests: index,
          });
        }
      }

      // For submit mode: accepted hidden cases expose no I/O data to the client
      const isHiddenCase = Boolean(testCase.isHidden);
      perTestResults.push({
        index: index + 1,
        status: 'Accepted',
        runtimeMs: runResult.durationMs || 0,
        memoryMb: runResult.memoryMb || 0,
        stdout: submission.mode === 'run' ? runResult.stdout : '',
        stderr: (submission.mode === 'run' || !isHiddenCase) ? runResult.stderr : '',
        input: submission.mode === 'run' ? testCase.input : (isHiddenCase ? '[hidden]' : testCase.input),
      });
    } finally {
      await fs.rm(workspace, { recursive: true, force: true });
    }
  }

  return finalizeSubmission(submission, {
    status: 'Accepted',
    runtimeMs: totalRuntimeMs,
    memoryMb: peakMemoryMb,
    stdout: perTestResults[0]?.stdout || '',
    perTestResults,
    totalTests: testCases.length,
    passedTests: testCases.length,
  });
};

export const buildSubmissionPayload = async ({ userId = null, problemId = null, language, sourceCode, mode, customInput = '' }) => {
  const submission = await Submission.create({
    userId,
    problemId,
    language,
    sourceCode,
    mode,
    customInput,
    status: 'QUEUED',
  });

  logger.info({
    message: 'Created submission record',
    submissionId: String(submission._id),
    problemId: problemId ? String(problemId) : '',
    language,
    mode,
    fingerprint: crypto.createHash('sha256').update(sourceCode).digest('hex').slice(0, 12),
  });

  return submission;
};