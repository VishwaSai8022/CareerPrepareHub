import AptitudeQuestion from '../models/aptitudeQuestion.model.js';
import CodingQuestion from '../models/codingQuestion.model.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../config/constants.js';
import { ApiError } from '../middleware/error.middleware.js';
import { escapeRegex } from '../utils/regex.js';

const normalize = (value = '') => String(value).trim().toLowerCase();
const toInt = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

const hasPremiumAccess = (user) => Boolean(user && (user.isPaid || user.role === 'admin'));

const getPagination = ({ page, limit }) => {
  const parsedPage = Math.max(toInt(page, DEFAULT_PAGE), 1);
  const parsedLimit = Math.min(Math.max(toInt(limit, DEFAULT_LIMIT), 1), MAX_LIMIT);
  return { page: parsedPage, limit: parsedLimit, skip: (parsedPage - 1) * parsedLimit };
};

export const getAptitudeList = async (query = {}) => {
  const { topic, difficulty } = query;
  const { page, limit, skip } = getPagination(query);

  const filters = { isPremium: false };
  if (topic) {
    const safeTopic = escapeRegex(String(topic).trim());
    filters.topic = { $regex: new RegExp(`^${safeTopic}$`, 'i') };
  }
  if (difficulty) filters.difficulty = normalize(difficulty);

  const [items, total] = await Promise.all([
    AptitudeQuestion.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AptitudeQuestion.countDocuments(filters),
  ]);

  return { items, total, page, limit };
};

export const getAptitudeById = async ({ id, user }) => {
  const question = await AptitudeQuestion.findById(id).lean();
  if (!question) throw new ApiError('Aptitude question not found', 404, 'APTITUDE_NOT_FOUND');

  if (question.isPremium && !hasPremiumAccess(user)) {
    throw new ApiError('Paid plan required to access this resource', 403, 'PAID_PLAN_REQUIRED');
  }

  return question;
};

export const getHardAptitudeForPaidUsers = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filters = { difficulty: 'hard', isPremium: true };

  const [items, total] = await Promise.all([
    AptitudeQuestion.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AptitudeQuestion.countDocuments(filters),
  ]);

  return { items, total, page, limit };
};

export const getCodingList = async (query = {}) => {
  const { difficulty, company, topic, search, user } = query;
  const { page, limit, skip } = getPagination(query);

  const filters = {};
  if (difficulty) filters.difficulty = normalize(difficulty);
  if (company) {
    const safeCompany = escapeRegex(String(company).trim());
    filters.company = { $regex: new RegExp(`^${safeCompany}$`, 'i') };
  }
  if (topic) {
    const safeTopic = escapeRegex(String(topic).trim());
    filters.topic = { $regex: new RegExp(`^${safeTopic}$`, 'i') };
  }

  if (search) {
    const keyword = escapeRegex(String(search).trim());
    filters.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { topic: { $regex: keyword, $options: 'i' } },
      { company: { $regex: keyword, $options: 'i' } },
      { category: { $regex: keyword, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    CodingQuestion.find(filters)
      .select('-testCases')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CodingQuestion.countDocuments(filters),
  ]);

  const canAccessPremium = hasPremiumAccess(user);
  const safeItems = items.map((item) => {
    if (!item.isPremium || canAccessPremium) return item;

    return {
      _id: item._id,
      title: item.title,
      difficulty: item.difficulty,
      company: item.company,
      topic: item.topic,
      category: item.category,
      isPremium: true,
      isLocked: true,
    };
  });

  return { items: safeItems, total, page, limit };
};


export const getCodingById = async ({ id, user }) => {
  const question = await CodingQuestion.findById(id).lean();
  if (!question) throw new ApiError('Coding question not found', 404, 'CODING_NOT_FOUND');

  if (question.isPremium && !hasPremiumAccess(user)) {
    throw new ApiError('Paid plan required to access this resource', 403, 'PAID_PLAN_REQUIRED');
  }

  // ── Validate sourceId bounds ──────────────────────────────────────────────
  // sourceId must be in range 358–447. Questions outside this range are treated
  // as data integrity issues and are not served to clients.
  const SOURCE_ID_MIN = 358;
  const SOURCE_ID_MAX = 447;
  if (question.sourceId != null) {
    if (question.sourceId > SOURCE_ID_MAX) {
      throw new ApiError(
        `Question sourceId ${question.sourceId} exceeds the maximum allowed value of ${SOURCE_ID_MAX}. Run the fix-sourceids script to resolve data integrity issues.`,
        422,
        'SOURCE_ID_OVERFLOW',
      );
    }
    if (question.sourceId < SOURCE_ID_MIN) {
      throw new ApiError(
        `Question sourceId ${question.sourceId} is below the minimum allowed value of ${SOURCE_ID_MIN}.`,
        422,
        'SOURCE_ID_UNDERFLOW',
      );
    }
  }

  // ── Strip hidden test cases from API response ─────────────────────────────
  // Hidden test cases are executed on the backend during submit, but their
  // input/output data must NEVER be exposed to the client. Only visible
  // (isHidden: false) test cases are included in the response — and even those
  // are sanitised to remove internal comparator configuration.
  if (Array.isArray(question.testCases)) {
    question.testCases = question.testCases
      .filter((tc) => !tc.isHidden)               // Remove hidden cases entirely
      .map(({ input, output }) => ({ input, output })); // Strip internal fields
  }

  return question;
};

