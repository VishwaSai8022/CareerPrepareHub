const normalizeWhitespace = (value = '') => String(value || '')
  .replace(/\r\n/g, '\n')
  .replace(/[ \t]+/g, ' ')
  .replace(/\s*,\s*/g, ',')
  .trim();

const parseTopLevelArray = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!(trimmed.startsWith('[') && trimmed.endsWith(']'))) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];

  const parts = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;

  for (let index = 0; index < inner.length; index += 1) {
    const ch = inner[index];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === '[') depth += 1;
      if (ch === ']') depth -= 1;
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }

  parts.push(current.trim());
  return parts;
};

const compareExact = (actual, expected) => actual === expected;

const compareFloatTolerance = (actual, expected, tolerance = 1e-6) => {
  const left = Number(actual);
  const right = Number(expected);
  if (Number.isNaN(left) || Number.isNaN(right)) return false;
  return Math.abs(left - right) <= tolerance;
};

const compareUnorderedArrays = (actual, expected) => {
  const left = parseTopLevelArray(actual);
  const right = parseTopLevelArray(expected);
  if (!left || !right) return false;
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((item, index) => item === sortedRight[index]);
};

export const compareOutputs = ({ actual = '', expected = '', comparison = {} }) => {
  const mode = comparison.mode || 'ignore_whitespace';
  const normalizedActual = normalizeWhitespace(actual);
  const normalizedExpected = normalizeWhitespace(expected);

  let passed = false;
  switch (mode) {
    case 'exact':
      passed = compareExact(String(actual || '').trim(), String(expected || '').trim());
      break;
    case 'float_tolerance':
      passed = compareFloatTolerance(normalizedActual, normalizedExpected, comparison.tolerance);
      break;
    case 'unordered_array':
      passed = compareUnorderedArrays(normalizedActual, normalizedExpected);
      break;
    case 'ignore_whitespace':
    default:
      passed = compareExact(normalizedActual, normalizedExpected);
      break;
  }

  return {
    passed,
    normalizedActual,
    normalizedExpected,
  };
};