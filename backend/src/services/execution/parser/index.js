const isDigit = (value = '') => /^-?\d+(\.\d+)?$/.test(String(value).trim());

const parseStringToken = (source, startIndex) => {
  let index = startIndex + 1;
  let value = '';

  while (index < source.length) {
    const ch = source[index];
    if (ch === '\\') {
      value += source[index + 1] || '';
      index += 2;
      continue;
    }
    if (ch === '"') {
      return { value, nextIndex: index + 1 };
    }
    value += ch;
    index += 1;
  }

  throw new Error('Unterminated string literal in test input.');
};

const skipWhitespace = (source, startIndex) => {
  let index = startIndex;
  while (index < source.length && /\s/.test(source[index])) index += 1;
  return index;
};

const parseLiteral = (source, startIndex = 0) => {
  let index = skipWhitespace(source, startIndex);
  if (index >= source.length) return { value: null, nextIndex: index };

  if (source[index] === '"') {
    return parseStringToken(source, index);
  }

  if (source[index] === '[') {
    index += 1;
    const items = [];
    index = skipWhitespace(source, index);
    while (index < source.length && source[index] !== ']') {
      const parsed = parseLiteral(source, index);
      items.push(parsed.value);
      index = skipWhitespace(source, parsed.nextIndex);
      if (source[index] === ',') {
        index += 1;
        index = skipWhitespace(source, index);
      }
    }
    if (source[index] !== ']') throw new Error('Unterminated array literal in test input.');
    return { value: items, nextIndex: index + 1 };
  }

  let token = '';
  while (index < source.length && !/[\],]/.test(source[index])) {
    token += source[index];
    index += 1;
  }
  token = token.trim();

  if (token === 'null') return { value: null, nextIndex: index };
  if (token === 'true') return { value: true, nextIndex: index };
  if (token === 'false') return { value: false, nextIndex: index };
  if (isDigit(token)) return { value: Number(token), nextIndex: index };
  return { value: token, nextIndex: index };
};

/**
 * Split a single line of comma-separated assignments into individual
 * assignment strings, e.g.:
 *   "root = [6,2,8], p=2, q=8" → ["root = [6,2,8]", "p=2", "q=8"]
 *
 * Only splits on commas that are at bracket-depth 0 and outside quotes,
 * AND where the part after the comma contains an '=' sign (indicating
 * a new assignment rather than a continuation of an array value).
 */
const splitAssignments = (line) => {
  const parts = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === '[' || ch === '(' || ch === '{') depth += 1;
      if (ch === ']' || ch === ')' || ch === '}') depth -= 1;
      if (ch === ',' && depth === 0) {
        // Look ahead: does the remainder contain "key = value"?
        const remainder = line.slice(i + 1).trim();
        if (/^\s*\w+\s*=/.test(remainder)) {
          parts.push(current.trim());
          current = '';
          continue;
        }
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

export const parseAssignmentInput = (rawInput = '') => {
  const result = {};

  // First split by newlines, then split each line by top-level commas
  const lines = String(rawInput || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const allAssignments = [];
  for (const line of lines) {
    allAssignments.push(...splitAssignments(line));
  }

  for (const assignment of allAssignments) {
    const separatorIndex = assignment.indexOf('=');
    if (separatorIndex < 0) continue;
    const key = assignment.slice(0, separatorIndex).trim();
    const rawValue = assignment.slice(separatorIndex + 1).trim();
    result[key] = parseLiteral(rawValue).value;
  }

  return result;
};

const castToType = (type, value) => {
  switch (String(type || '').trim()) {
    case 'int':
    case 'long':
    case 'double':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'String':
      return value == null ? '' : String(value);
    default:
      return value;
  }
};

export const resolveParameterValues = ({ rawInput = '', parameters = [] }) => {
  const assignments = parseAssignmentInput(rawInput);
  const assignmentKeys = Object.keys(assignments);
  const resolved = {};

  // First try: match by name
  let allMatched = true;
  for (const parameter of parameters) {
    if (parameter.name in assignments) {
      resolved[parameter.name] = castToType(parameter.type, assignments[parameter.name]);
    } else {
      allMatched = false;
      break;
    }
  }

  if (allMatched) return resolved;

  // Fallback: positional mapping (input names ≠ parameter names)
  // e.g. input: "adjList = [[2,4],[1,3]]" → function param: "Node node"
  const positionalResolved = {};
  for (let i = 0; i < parameters.length; i++) {
    if (i < assignmentKeys.length) {
      positionalResolved[parameters[i].name] = castToType(
        parameters[i].type,
        assignments[assignmentKeys[i]]
      );
    } else {
      throw new Error(`Missing input value for parameter: ${parameters[i].name}`);
    }
  }

  return positionalResolved;
};