import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

import connectDB from '../src/config/db.js';
import logger from '../src/logger/index.js';
import CodingQuestion from '../src/models/codingQuestion.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_GENERATOR_PATH = 'C:\\Users\\Hp\\Downloads\\generate_hidden_tests.py';
const QUESTIONS_JSON_PATH = path.resolve(__dirname, 'data', 'questions.json');

const normalizeTitle = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/â€”|—|–/g, '-')
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[^\w\s'"-]/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

const runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    shell: false,
    windowsHide: true,
    ...options,
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', reject);
  child.on('close', (code) => {
    if (code !== 0) {
      reject(new Error(stderr || stdout || `${command} exited with code ${code}`));
      return;
    }

    resolve({ stdout, stderr });
  });
});

const dedupeTestCases = (testCases = []) => {
  const seen = new Set();
  return testCases.filter((testCase) => {
    const key = JSON.stringify({
      input: String(testCase.input || '').trim(),
      output: String(testCase.output || '').trim(),
      isHidden: Boolean(testCase.isHidden),
    });

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const generateMergedSourceData = async (generatorPath) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'careerprephub-hidden-tests-'));
  const tempInputPath = path.join(tempDir, 'career_prep_hub_codingquestions.json');
  const tempOutputPath = path.join(tempDir, 'output.json');
  const tempScriptPath = path.join(tempDir, 'patched-generate-hidden-tests.py');

  try {
    const generatorContent = await fs.readFile(generatorPath, 'utf8');
    const patchedScript = generatorContent
      .replaceAll('/mnt/user-data/uploads/career_prep_hub_codingquestions.json', tempInputPath.replaceAll('\\', '/'))
      .replaceAll('/home/claude/output.json', tempOutputPath.replaceAll('\\', '/'));

    await fs.copyFile(QUESTIONS_JSON_PATH, tempInputPath);
    await fs.writeFile(tempScriptPath, patchedScript, 'utf8');

    const { stdout } = await runCommand('python', [tempScriptPath]);
    logger.info(stdout.trim() || 'Hidden testcase generator executed successfully');

    const mergedContent = await fs.readFile(tempOutputPath, 'utf8');
    return JSON.parse(mergedContent);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

const mergeHiddenTestsIntoDatabase = async (generatedQuestions) => {
  const existingQuestions = await CodingQuestion.find({}).select('sourceId title sampleInput sampleOutput testCases').lean();

  const existingByTitle = new Map(
    existingQuestions.map((question) => [normalizeTitle(question.title), question]),
  );
  const existingBySourceId = new Map(
    existingQuestions
      .filter((question) => Number.isFinite(question.sourceId))
      .map((question) => [question.sourceId, question]),
  );

  const unmatchedSourceTitles = [];
  const matchedTitles = [];

  for (const item of generatedQuestions) {
    const normalizedTitle = normalizeTitle(item.title || item.question);
    const sourceId = Number.isFinite(item.id) ? item.id : undefined;
    const existing = (Number.isFinite(sourceId) ? existingBySourceId.get(sourceId) : null)
      || existingByTitle.get(normalizedTitle);

    if (!existing) {
      unmatchedSourceTitles.push(item.title || item.question || 'Untitled');
      continue;
    }

    const visibleCases = Array.isArray(existing.testCases)
      ? existing.testCases.filter((testCase) => !testCase.isHidden)
      : [];

    const fallbackVisibleCase = existing.sampleInput || existing.sampleOutput
      ? [{ input: existing.sampleInput || 'sample input', output: existing.sampleOutput || 'sample output', isHidden: false }]
      : [];

    const hiddenCases = Array.isArray(item.hiddenTestCases)
      ? item.hiddenTestCases.map((testCase) => ({
        input: String(testCase.input || '').trim(),
        output: String(testCase.output || '').trim(),
        isHidden: true,
      }))
      : [];

    const mergedTestCases = dedupeTestCases([
      ...(visibleCases.length ? visibleCases : fallbackVisibleCase),
      ...hiddenCases,
    ]);

    await CodingQuestion.updateOne(
      { _id: existing._id },
      { $set: { testCases: mergedTestCases } },
    );

    matchedTitles.push(existing.title);
  }

  const normalizedMatchedSet = new Set(matchedTitles.map((title) => normalizeTitle(title)));
  const existingWithoutMatch = existingQuestions
    .filter((question) => !normalizedMatchedSet.has(normalizeTitle(question.title)))
    .map((question) => question.title);

  return {
    matchedCount: matchedTitles.length,
    unmatchedSourceTitles,
    existingWithoutMatch,
  };
};

async function run() {
  const generatorPath = process.argv[2] || DEFAULT_GENERATOR_PATH;

  try {
    logger.info(`Using hidden testcase generator: ${generatorPath}`);
    await connectDB();

    const generatedQuestions = await generateMergedSourceData(generatorPath);
    const summary = await mergeHiddenTestsIntoDatabase(generatedQuestions);

    logger.info(`Hidden testcase merge completed. Matched: ${summary.matchedCount}`);

    if (summary.unmatchedSourceTitles.length) {
      logger.warn(`JSON entries not matched by title (${summary.unmatchedSourceTitles.length}): ${summary.unmatchedSourceTitles.slice(0, 20).join(', ')}`);
    }

    if (summary.existingWithoutMatch.length) {
      logger.warn(`Existing DB coding questions without testcase match (${summary.existingWithoutMatch.length}): ${summary.existingWithoutMatch.slice(0, 20).join(', ')}`);
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Hidden testcase merge failed: ${error.message}`);
    process.exit(1);
  }
}

run();