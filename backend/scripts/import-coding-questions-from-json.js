import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import CodingQuestion from '../src/models/codingQuestion.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const QUESTIONS_PATH = path.resolve(__dirname, 'data', 'questions.json');

const normalizeDifficulty = (value = 'easy') => {
  const normalized = String(value).trim().toLowerCase();
  return ['easy', 'medium', 'hard'].includes(normalized) ? normalized : 'easy';
};

const buildTestCases = (item) => {
  const fallbackOutput = String(item?.sampleOutput ?? '').trim();
  const source = Array.isArray(item?.testCases) ? item.testCases : [];

  const normalized = source
    .map((tc) => {
      const input = String(tc?.input ?? '').trim();
      const rawOutput = String(tc?.output ?? '').trim();
      const output = rawOutput || fallbackOutput;

      if (!input || !output) return null;

      return {
        input,
        output,
        isHidden: Boolean(tc?.isHidden),
      };
    })
    .filter(Boolean);

  if (normalized.length > 0) return normalized;

  const sampleInput = String(item?.sampleInput ?? '').trim();
  if (sampleInput && fallbackOutput) {
    return [{ input: sampleInput, output: fallbackOutput, isHidden: false }];
  }

  return [{ input: 'sample input', output: 'sample output', isHidden: false }];
};

const normalizeDoc = (item) => ({
  sourceId: Number.isFinite(item?.sourceId) ? item.sourceId : undefined,
  company: item?.company || 'General',
  topic: item?.topic || 'General',
  category: item?.category || item?.topic || 'General',
  title: item?.title || 'Untitled Coding Question',
  description: item?.description || item?.title || 'No description provided.',
  constraints: item?.constraints || '',
  sampleInput: item?.sampleInput || '',
  sampleOutput: item?.sampleOutput || '',
  explanation: item?.explanation || '',
  hints: Array.isArray(item?.hints) ? item.hints : [],
  difficulty: normalizeDifficulty(item?.difficulty),
  testCases: buildTestCases(item),
  execution: item?.execution && typeof item.execution === 'object' ? item.execution : undefined,
  isPremium: typeof item?.isPremium === 'boolean'
    ? item.isPremium
    : normalizeDifficulty(item?.difficulty) === 'hard',
});

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI);

    const raw = await fs.readFile(QUESTIONS_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.log('No questions found to import.');
      process.exit(0);
    }

    const normalized = parsed.map(normalizeDoc);

    let inserted = 0;
    let updated = 0;

    for (const doc of normalized) {
      const filter = Number.isFinite(doc.sourceId)
        ? { sourceId: doc.sourceId }
        : { title: doc.title, company: doc.company };

      const existing = await CodingQuestion.findOne(filter).select('_id').lean();

      await CodingQuestion.findOneAndUpdate(
        filter,
        { $set: doc },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      );

      if (existing) updated += 1;
      else inserted += 1;
    }

    console.log(`Coding questions import complete. Inserted: ${inserted}, Updated: ${updated}, Total processed: ${normalized.length}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Import failed: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

run();
