import mongoose from 'mongoose';

const perTestResultSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 'Time Limit Exceeded', 'Skipped'],
    required: true,
  },
  runtimeMs: { type: Number, default: 0 },
  memoryMb: { type: Number, default: 0 },
  stdout: { type: String, default: '' },
  stderr: { type: String, default: '' },
  input: { type: String, default: '' },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingQuestion',
    default: null,
    index: true,
  },
  mode: {
    type: String,
    enum: ['run', 'submit'],
    required: true,
    default: 'submit',
    index: true,
  },
  language: {
    type: String,
    enum: ['java', 'python', 'c', 'cpp', 'javascript'],
    required: true,
    index: true,
  },
  sourceCode: {
    type: String,
    required: true,
  },
  customInput: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['QUEUED', 'RUNNING', 'Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 'Time Limit Exceeded', 'System Error'],
    default: 'QUEUED',
    index: true,
  },
  queueJobId: {
    type: String,
    default: '',
    index: true,
  },
  runtimeMs: {
    type: Number,
    default: 0,
  },
  memoryMb: {
    type: Number,
    default: 0,
  },
  stdout: {
    type: String,
    default: '',
  },
  stderr: {
    type: String,
    default: '',
  },
  compileError: {
    type: String,
    default: '',
  },
  runtimeError: {
    type: String,
    default: '',
  },
  perTestResults: {
    type: [perTestResultSchema],
    default: [],
  },
  startedAt: {
    type: Date,
    default: null,
  },
  failedTestCase: {
    type: new mongoose.Schema({
      index: { type: Number },
      input: { type: String },
      expectedOutput: { type: String },
      actualOutput: { type: String },
    }, { _id: false }),
    default: null,
  },
  totalTests: {
    type: Number,
    default: 0,
  },
  passedTests: {
    type: Number,
    default: 0,
  },
  finishedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ problemId: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;