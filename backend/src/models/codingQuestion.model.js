import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true, trim: true },
  output: { type: String, required: true, trim: true },
  isHidden: { type: Boolean, default: false },
  comparison: {
    ignoreWhitespace: { type: Boolean, default: true },
    unordered: { type: Boolean, default: false },
  },
}, { _id: false });

const executionParameterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
}, { _id: false });

const languageExecutionSchema = new mongoose.Schema({
  entryClass: {
    type: String,
    trim: true,
    default: 'Solution',
  },
  methodName: {
    type: String,
    trim: true,
    default: '',
  },
  returnType: {
    type: String,
    trim: true,
    default: 'void',
  },
  parameters: {
    type: [executionParameterSchema],
    default: [],
  },
  helperTypes: {
    type: [String],
    default: [],
  },
  enableMethodDetectionFallback: {
    type: Boolean,
    default: true,
  },
  comparator: {
    mode: {
      type: String,
      enum: ['exact', 'ignore_whitespace', 'float_tolerance', 'unordered_array', 'custom'],
      default: 'ignore_whitespace',
    },
    tolerance: {
      type: Number,
      default: 0.000001,
    },
    customKey: {
      type: String,
      trim: true,
      default: '',
    },
  },
}, { _id: false });

const executionSchema = new mongoose.Schema({
  java: {
    type: languageExecutionSchema,
    default: () => ({ entryClass: 'Solution' }),
  },
  python: {
    type: languageExecutionSchema,
    default: () => ({ entryClass: 'Solution' }),
  },
  cpp: {
    type: languageExecutionSchema,
    default: () => ({ entryClass: 'Solution' }),
  },
  javascript: {
    type: languageExecutionSchema,
    default: () => ({}),
  },
}, { _id: false });

const codingQuestionSchema = new mongoose.Schema({
  sourceId: {
    type: Number,
    index: true,
  },
  company: {
    type: String,
    trim: true,
    default: 'General',
    index: true,
  },
  topic: {
    type: String,
    trim: true,
    default: 'General',
    index: true,
  },
  category: {
    type: String,
    trim: true,
    default: 'General',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  constraints: {
    type: String,
    trim: true,
    default: '',
  },
  sampleInput: {
    type: String,
    trim: true,
    default: '',
  },
  sampleOutput: {
    type: String,
    trim: true,
    default: '',
  },
  explanation: {
    type: String,
    trim: true,
    default: '',
  },
  hints: {
    type: [String],
    default: [],
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
    default: 'easy',
    index: true,
  },
  testCases: {
    type: [testCaseSchema],
    default: [],
  },
  execution: {
    type: executionSchema,
    default: () => ({}),
  },
  isPremium: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

codingQuestionSchema.index({ difficulty: 1, company: 1, topic: 1, createdAt: -1 });
codingQuestionSchema.index({ isPremium: 1, createdAt: -1 });

const CodingQuestion = mongoose.model('CodingQuestion', codingQuestionSchema);

export default CodingQuestion;
