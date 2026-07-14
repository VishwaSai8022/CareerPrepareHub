import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const EXECUTION_TIMEOUT_MS = 5000;
const MAX_OUTPUT_SIZE = 64 * 1024;
const JAVA_DEFAULT_CLASS_NAME = 'Main';
const DEFAULT_MEMORY_LIMIT_MB = 256;

const LANGUAGE_CONFIG = {
  python: {
    sourceFile: 'main.py',
    build: null,
    run: () => ({ command: 'python', args: ['main.py'] }),
  },
  c: {
    sourceFile: 'main.c',
    build: () => ({ command: 'gcc', args: ['main.c', '-O2', '-lm', '-o', 'main.exe'] }),
    run: () => ({ command: process.platform === 'win32' ? 'main.exe' : './main.exe', args: [] }),
  },
  java: {
    sourceFile: 'Main.java',
    build: () => ({ command: 'javac', args: ['Main.java'] }),
    run: () => ({ command: 'java', args: ['-cp', '.', 'Main'] }),
  },
  cpp: {
    sourceFile: 'main.cpp',
    build: () => ({ command: 'g++', args: ['main.cpp', '-O2', '-std=c++17', '-o', 'main.exe'] }),
    run: () => ({ command: process.platform === 'win32' ? 'main.exe' : './main.exe', args: [] }),
  },
};

const JAVA_HELPERS = {
  TreeNode: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  TreeNode() {}
  TreeNode(int val) { this.val = val; }
  TreeNode(int val, TreeNode left, TreeNode right) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}`,
  ListNode: `class ListNode {
  int val;
  ListNode next;
  ListNode() {}
  ListNode(int val) { this.val = val; }
  ListNode(int val, ListNode next) {
    this.val = val;
    this.next = next;
  }
}`,
};

const STRUCTURED_ERROR_STATUS = Object.freeze({
  COMPILATION: 'Compilation Error',
  RUNTIME: 'Runtime Error',
  TLE: 'Time Limit Exceeded',
  WA: 'Wrong Answer',
  ACCEPTED: 'Accepted',
  INVALID_INPUT: 'Invalid Input',
  UNSUPPORTED: 'Unsupported Language',
});

const normalizeLanguage = (language) => {
  const value = String(language || '').trim().toLowerCase();
  if (value === 'c++') return 'cpp';
  return value;
};

const trimBuffer = (value = '') => {
  if (value.length <= MAX_OUTPUT_SIZE) return value;
  return `${value.slice(0, MAX_OUTPUT_SIZE)}\n\n[output truncated]`;
};

const escapeForJavaString = (value = '') => JSON.stringify(String(value))
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const normalizeExecutionLanguage = (language) => normalizeLanguage(language);

const buildJudgeResponse = ({
  status,
  runtime = '--',
  memory = '--',
  output = '',
  error = '',
  failedCase = null,
}) => ({
  status,
  runtime,
  memory,
  output,
  error,
  failedCase,
});

const parseMemoryUsageMb = (stderr = '') => {
  const directMatch = String(stderr).match(/MEMORY_PEAK_KB=(\d+)/);
  if (directMatch) {
    const value = Number.parseInt(directMatch[1], 10);
    if (!Number.isNaN(value)) return `${(value / 1024).toFixed(2)} MB`;
  }

  const verboseMatch = String(stderr).match(/Maximum resident set size \(kbytes\):\s*(\d+)/i);
  if (verboseMatch) {
    const value = Number.parseInt(verboseMatch[1], 10);
    if (!Number.isNaN(value)) return `${(value / 1024).toFixed(2)} MB`;
  }

  return '--';
};

const detectJavaMethodMetadata = (userCode = '') => {
  const code = String(userCode || '');
  const solutionClassMatch = code.match(/class\s+Solution\s*\{([\s\S]*)\}\s*$/m);
  if (!solutionClassMatch) return null;

  const body = solutionClassMatch[1];
  const methodRegex = /public\s+([\w<>\[\]]+)\s+(\w+)\s*\(([^)]*)\)/g;
  const methods = [];
  let match;
  while ((match = methodRegex.exec(body)) !== null) {
    const [, returnType, methodName, rawParams] = match;
    const parameters = String(rawParams || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part, index) => {
        const paramMatch = part.match(/^(.+?)\s+(\w+)$/);
        if (!paramMatch) return null;
        return {
          type: paramMatch[1].trim(),
          name: paramMatch[2].trim() || `arg${index}`,
        };
      })
      .filter(Boolean);

    methods.push({ returnType, methodName, parameters });
  }

  if (methods.length !== 1) return null;
  return {
    entryClass: 'Solution',
    methodName: methods[0].methodName,
    returnType: methods[0].returnType,
    parameters: methods[0].parameters,
    helperTypes: [],
  };
};

const resolveJavaExecutionMeta = ({ executionMeta, userCode }) => {
  const meta = executionMeta || {};
  if (meta?.methodName && meta?.returnType) {
    return meta;
  }

  if (meta?.enableMethodDetectionFallback === false) {
    throw new Error('Java execution metadata is missing. Configure methodName, returnType, and parameters for this problem.');
  }

  const detected = detectJavaMethodMetadata(userCode);
  if (detected) {
    return {
      ...detected,
      helperTypes: Array.isArray(meta?.helperTypes) ? meta.helperTypes : detected.helperTypes,
    };
  }

  throw new Error(
    'Java execution metadata is missing and automatic method detection could not determine the Solution signature.',
  );
};

const buildJavaReadExpression = ({ type, name, parserVar = 'parser' }) => {
  const key = JSON.stringify(name);
  switch (String(type || '').trim()) {
    case 'int': return `${parserVar}.getInt(${key})`;
    case 'long': return `${parserVar}.getLong(${key})`;
    case 'double': return `${parserVar}.getDouble(${key})`;
    case 'boolean': return `${parserVar}.getBoolean(${key})`;
    case 'String': return `${parserVar}.getString(${key})`;
    case 'int[]': return `${parserVar}.getIntArray(${key})`;
    case 'int[][]': return `${parserVar}.getIntMatrix(${key})`;
    case 'long[]': return `${parserVar}.getLongArray(${key})`;
    case 'long[][]': return `${parserVar}.getLongMatrix(${key})`;
    case 'double[]': return `${parserVar}.getDoubleArray(${key})`;
    case 'double[][]': return `${parserVar}.getDoubleMatrix(${key})`;
    case 'String[]': return `${parserVar}.getStringArray(${key})`;
    case 'String[][]': return `${parserVar}.getStringMatrix(${key})`;
    case 'List<Integer>': return `${parserVar}.getIntegerList(${key})`;
    case 'List<String>': return `${parserVar}.getStringList(${key})`;
    case 'List<List<Integer>>': return `${parserVar}.getIntegerListMatrix(${key})`;
    case 'TreeNode': return `${parserVar}.getTreeNode(${key})`;
    case 'ListNode': return `${parserVar}.getListNode(${key})`;
    default:
      throw new Error(`Unsupported Java parameter type: ${type}`);
  }
};

const buildJavaInvocation = ({ meta }) => {
  const entryClass = String(meta.entryClass || 'Solution').trim() || 'Solution';
  const methodName = String(meta.methodName || '').trim();
  const returnType = String(meta.returnType || 'void').trim() || 'void';
  const parameters = Array.isArray(meta.parameters) ? meta.parameters : [];

  if (!methodName) {
    throw new Error('Java execution metadata is missing methodName.');
  }

  const parameterReads = parameters
    .map((parameter) => `    ${parameter.type} ${parameter.name} = ${buildJavaReadExpression(parameter)};`)
    .join('\n');

  const args = parameters.map((parameter) => parameter.name).join(', ');
  const invoke = returnType === 'void'
    ? `    solution.${methodName}(${args});\n    System.out.print(\"\");`
    : `    ${returnType} result = solution.${methodName}(${args});\n    System.out.print(OutputFormatter.format(result));`;

  return {
    entryClass,
    parameterReads,
    invoke,
  };
};

const buildJavaWrapper = ({ userCode, meta, rawInput = '' }) => {
  const helperTypes = Array.isArray(meta.helperTypes) ? meta.helperTypes : [];
  const helperSource = helperTypes
    .map((helper) => JAVA_HELPERS[helper] || '')
    .filter(Boolean)
    .join('\n\n');
  const { entryClass, parameterReads, invoke } = buildJavaInvocation({ meta });
  const injectedInput = escapeForJavaString(rawInput);

  return `import java.util.*;

${helperSource}
${helperSource ? '\n' : ''}
${userCode}

public class ${JAVA_DEFAULT_CLASS_NAME} {
  public static void main(String[] args) throws Exception {
    InputParser parser = new InputParser(${injectedInput});
${parameterReads ? `${parameterReads}\n` : ''}    ${entryClass} solution = new ${entryClass}();
${invoke}
  }
}

class InputParser {
  private final Map<String, String> values = new HashMap<>();

  InputParser(String raw) {
    if (raw == null) return;
    String[] lines = raw.split("\\r?\\n");
    for (String line : lines) {
      if (line == null) continue;
      line = line.trim();
      if (line.isEmpty()) continue;
      int index = line.indexOf('=');
      if (index < 0) continue;
      String key = line.substring(0, index).trim();
      String value = line.substring(index + 1).trim();
      values.put(key, value);
    }
  }

  String require(String key) {
    if (!values.containsKey(key)) {
      throw new IllegalArgumentException("Missing input for parameter: " + key);
    }
    return values.get(key);
  }

  int getInt(String key) {
    return Integer.parseInt(cleanScalar(require(key)));
  }

  long getLong(String key) {
    return Long.parseLong(cleanScalar(require(key)));
  }

  double getDouble(String key) {
    return Double.parseDouble(cleanScalar(require(key)));
  }

  boolean getBoolean(String key) {
    return Boolean.parseBoolean(cleanScalar(require(key)));
  }

  String getString(String key) {
    String value = require(key).trim();
    if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
      return value.substring(1, value.length() - 1);
    }
    return value;
  }

  int[] getIntArray(String key) {
    String[] parts = splitArrayValues(require(key));
    int[] result = new int[parts.length];
    for (int i = 0; i < parts.length; i++) {
      result[i] = Integer.parseInt(cleanScalar(parts[i]));
    }
    return result;
  }

  long[] getLongArray(String key) {
    String[] parts = splitArrayValues(require(key));
    long[] result = new long[parts.length];
    for (int i = 0; i < parts.length; i++) {
      result[i] = Long.parseLong(cleanScalar(parts[i]));
    }
    return result;
  }

  double[] getDoubleArray(String key) {
    String[] parts = splitArrayValues(require(key));
    double[] result = new double[parts.length];
    for (int i = 0; i < parts.length; i++) {
      result[i] = Double.parseDouble(cleanScalar(parts[i]));
    }
    return result;
  }

  String[] getStringArray(String key) {
    String[] parts = splitArrayValues(require(key));
    String[] result = new String[parts.length];
    for (int i = 0; i < parts.length; i++) {
      result[i] = unquote(parts[i].trim());
    }
    return result;
  }

  int[][] getIntMatrix(String key) {
    String[] rows = splitTopLevelElements(require(key));
    int[][] result = new int[rows.length][];
    for (int i = 0; i < rows.length; i++) {
      result[i] = parseIntArray(rows[i]);
    }
    return result;
  }

  long[][] getLongMatrix(String key) {
    String[] rows = splitTopLevelElements(require(key));
    long[][] result = new long[rows.length][];
    for (int i = 0; i < rows.length; i++) {
      result[i] = parseLongArray(rows[i]);
    }
    return result;
  }

  double[][] getDoubleMatrix(String key) {
    String[] rows = splitTopLevelElements(require(key));
    double[][] result = new double[rows.length][];
    for (int i = 0; i < rows.length; i++) {
      result[i] = parseDoubleArray(rows[i]);
    }
    return result;
  }

  String[][] getStringMatrix(String key) {
    String[] rows = splitTopLevelElements(require(key));
    String[][] result = new String[rows.length][];
    for (int i = 0; i < rows.length; i++) {
      result[i] = parseStringArray(rows[i]);
    }
    return result;
  }

  List<Integer> getIntegerList(String key) {
    int[] values = getIntArray(key);
    List<Integer> result = new ArrayList<>();
    for (int value : values) result.add(value);
    return result;
  }

  List<String> getStringList(String key) {
    return new ArrayList<>(Arrays.asList(getStringArray(key)));
  }

  List<List<Integer>> getIntegerListMatrix(String key) {
    int[][] matrix = getIntMatrix(key);
    List<List<Integer>> result = new ArrayList<>();
    for (int[] row : matrix) {
      List<Integer> list = new ArrayList<>();
      for (int value : row) list.add(value);
      result.add(list);
    }
    return result;
  }

  TreeNode getTreeNode(String key) {
    String[] values = splitArrayValues(require(key));
    if (values.length == 0) return null;
    String first = cleanScalar(values[0]);
    if (first.isEmpty() || first.equals("null")) return null;

    TreeNode root = new TreeNode(Integer.parseInt(first));
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    int index = 1;

    while (!queue.isEmpty() && index < values.length) {
      TreeNode node = queue.poll();
      if (node == null) continue;

      if (index < values.length) {
        String left = cleanScalar(values[index++]);
        if (!left.isEmpty() && !left.equals("null")) {
          node.left = new TreeNode(Integer.parseInt(left));
          queue.offer(node.left);
        }
      }

      if (index < values.length) {
        String right = cleanScalar(values[index++]);
        if (!right.isEmpty() && !right.equals("null")) {
          node.right = new TreeNode(Integer.parseInt(right));
          queue.offer(node.right);
        }
      }
    }

    return root;
  }

  ListNode getListNode(String key) {
    int[] values = getIntArray(key);
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    for (int value : values) {
      tail.next = new ListNode(value);
      tail = tail.next;
    }
    return dummy.next;
  }

  private static String cleanScalar(String value) {
    return value == null ? "" : value.trim();
  }

  private static String unquote(String value) {
    if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
      return value.substring(1, value.length() - 1);
    }
    return value;
  }

  private static String[] splitArrayValues(String raw) {
    return splitSimpleCsv(stripOuterBrackets(raw));
  }

  private static String[] splitTopLevelElements(String raw) {
    String value = stripOuterBrackets(raw);
    if (value.isEmpty()) return new String[0];

    List<String> tokens = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean inQuotes = false;
    int depth = 0;
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (ch == '"') {
        inQuotes = !inQuotes;
        current.append(ch);
        continue;
      }
      if (!inQuotes) {
        if (ch == '[') depth += 1;
        if (ch == ']') depth -= 1;
        if (ch == ',' && depth == 0) {
          tokens.add(current.toString().trim());
          current.setLength(0);
          continue;
        }
      }
      current.append(ch);
    }
    tokens.add(current.toString().trim());
    return tokens.toArray(new String[0]);
  }

  private static String stripOuterBrackets(String raw) {
    String value = raw == null ? "" : raw.trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.substring(1, value.length() - 1).trim();
    }
    return value;
  }

  private static String[] splitSimpleCsv(String value) {
    if (value.isEmpty()) return new String[0];
    List<String> tokens = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean inQuotes = false;
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (ch == '"') {
        inQuotes = !inQuotes;
        current.append(ch);
        continue;
      }
      if (ch == ',' && !inQuotes) {
        tokens.add(current.toString().trim());
        current.setLength(0);
        continue;
      }
      current.append(ch);
    }
    tokens.add(current.toString().trim());
    return tokens.toArray(new String[0]);
  }

  private static int[] parseIntArray(String raw) {
    String[] parts = splitArrayValues(raw);
    int[] result = new int[parts.length];
    for (int i = 0; i < parts.length; i++) result[i] = Integer.parseInt(cleanScalar(parts[i]));
    return result;
  }

  private static long[] parseLongArray(String raw) {
    String[] parts = splitArrayValues(raw);
    long[] result = new long[parts.length];
    for (int i = 0; i < parts.length; i++) result[i] = Long.parseLong(cleanScalar(parts[i]));
    return result;
  }

  private static double[] parseDoubleArray(String raw) {
    String[] parts = splitArrayValues(raw);
    double[] result = new double[parts.length];
    for (int i = 0; i < parts.length; i++) result[i] = Double.parseDouble(cleanScalar(parts[i]));
    return result;
  }

  private static String[] parseStringArray(String raw) {
    String[] parts = splitArrayValues(raw);
    String[] result = new String[parts.length];
    for (int i = 0; i < parts.length; i++) result[i] = unquote(parts[i].trim());
    return result;
  }
}

class OutputFormatter {
  static String format(Object value) {
    if (value == null) return "null";
    if (value instanceof int[]) return Arrays.toString((int[]) value);
    if (value instanceof int[][]) return Arrays.deepToString((int[][]) value);
    if (value instanceof long[]) return Arrays.toString((long[]) value);
    if (value instanceof long[][]) return Arrays.deepToString((long[][]) value);
    if (value instanceof double[]) return Arrays.toString((double[]) value);
    if (value instanceof double[][]) return Arrays.deepToString((double[][]) value);
    if (value instanceof boolean[]) return Arrays.toString((boolean[]) value);
    if (value instanceof boolean[][]) return Arrays.deepToString((boolean[][]) value);
    if (value instanceof Object[]) return Arrays.deepToString((Object[]) value);
    if (value instanceof TreeNode) return serializeTree((TreeNode) value);
    if (value instanceof ListNode) return serializeList((ListNode) value);
    return String.valueOf(value);
  }

  static String serializeTree(TreeNode root) {
    if (root == null) return "[]";
    List<String> values = new ArrayList<>();
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
      TreeNode node = queue.poll();
      if (node == null) {
        values.add("null");
        continue;
      }
      values.add(String.valueOf(node.val));
      queue.offer(node.left);
      queue.offer(node.right);
    }
    int end = values.size() - 1;
    while (end >= 0 && "null".equals(values.get(end))) end -= 1;
    return values.subList(0, end + 1).toString();
  }

  static String serializeList(ListNode head) {
    List<Integer> values = new ArrayList<>();
    while (head != null) {
      values.add(head.val);
      head = head.next;
    }
    return values.toString();
  }
}`;
};

const splitComparableTopLevel = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!(trimmed.startsWith('[') && trimmed.endsWith(']'))) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  const parts = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
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

const normalizeOutput = (value = '', options = {}) => {
  const { ignoreWhitespace = true, unordered = false } = options;
  let normalized = String(value || '').replace(/\r\n/g, '\n').trim();
  if (ignoreWhitespace) {
    normalized = normalized.replace(/[ \t]+/g, ' ');
    normalized = normalized.replace(/\s*,\s*/g, ',');
    normalized = normalized.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');
  }

  if (unordered) {
    const topLevel = splitComparableTopLevel(normalized);
    if (topLevel) {
      normalized = `[${topLevel.map((part) => part.trim()).sort().join(',')}]`;
    }
  }

  return normalized;
};

const formatCommandError = (command, error) => {
  if (error?.code === 'ENOENT') {
    return `${command} is not installed or not available in PATH on the backend server.`;
  }

  return error?.message || `Failed to start ${command}.`;
};

const runProcess = ({ command, args, cwd, input = '', timeoutMs = EXECUTION_TIMEOUT_MS }) => new Promise((resolve) => {
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
      stdout: trimBuffer(result.stdout || ''),
      stderr: trimBuffer(result.stderr || ''),
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
    finalize({
      code: 1,
      stdout,
      stderr: `${stderr}${stderr ? '\n' : ''}${formatCommandError(command, error)}`,
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

  if (input) {
    child.stdin.write(input);
  }
  child.stdin.end();
});

export const executeUserCode = async ({ code, language, input = '' }) => {
  const normalizedLanguage = normalizeExecutionLanguage(language);
  const config = LANGUAGE_CONFIG[normalizedLanguage];

  if (!config) {
    return {
      status: 'error',
      output: '',
      error: `Unsupported language: ${language}. Supported languages are java, python, and cpp.`,
      executionStatus: 'Unsupported Language',
      runtime: '--',
    };
  }

  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'careerprephub-run-'));

  try {
    await fs.writeFile(path.join(workspaceRoot, config.sourceFile), code, 'utf8');

    if (config.build) {
      const buildStep = config.build();
      const buildResult = await runProcess({
        command: buildStep.command,
        args: buildStep.args,
        cwd: workspaceRoot,
        timeoutMs: EXECUTION_TIMEOUT_MS,
      });

      if (buildResult.code !== 0) {
        return {
          status: 'error',
          output: buildResult.stdout,
          error: buildResult.stderr || 'Compilation failed.',
          executionStatus: buildResult.timedOut ? 'Compilation Timeout' : 'Compilation Error',
          runtime: `${buildResult.durationMs} ms`,
        };
      }
    }

    const runStep = config.run();
    const runResult = await runProcess({
      command: runStep.command,
      args: runStep.args,
      cwd: workspaceRoot,
      input,
      timeoutMs: EXECUTION_TIMEOUT_MS,
    });

    if (runResult.code !== 0) {
      return {
        status: 'error',
        output: runResult.stdout,
        error: runResult.stderr || 'Execution failed.',
        executionStatus: runResult.timedOut ? 'Time Limit Exceeded' : 'Runtime Error',
        runtime: `${runResult.durationMs} ms`,
      };
    }

    return {
      status: 'success',
      output: runResult.stdout || 'Program executed successfully with no output.',
      error: '',
      executionStatus: STRUCTURED_ERROR_STATUS.ACCEPTED,
      runtime: `${runResult.durationMs} ms`,
      memory: parseMemoryUsageMb(runResult.stderr),
    };
  } finally {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  }
};

export const executeJavaWithWrapper = async ({ userCode, executionMeta, input = '' }) => {
  const resolvedMeta = resolveJavaExecutionMeta({ executionMeta, userCode });
  const wrappedCode = buildJavaWrapper({
    userCode,
    meta: resolvedMeta,
    rawInput: input,
  });

  return executeUserCode({
    code: wrappedCode,
    language: 'java',
    input: '',
  });
};

export const judgeSubmission = async ({ code, language, question }) => {
  const normalizedLanguage = normalizeExecutionLanguage(language);
  const testCases = Array.isArray(question?.testCases) ? question.testCases : [];
  const hiddenCases = testCases.filter((testCase) => testCase?.isHidden);

  if (hiddenCases.length === 0) {
    throw new Error('No hidden test cases configured for this problem.');
  }

  let totalRuntimeMs = 0;

  for (let index = 0; index < hiddenCases.length; index += 1) {
    const testCase = hiddenCases[index];
    const result = normalizedLanguage === 'java'
      ? await executeJavaWithWrapper({
        userCode: code,
        executionMeta: question?.execution?.java,
        input: testCase.input,
      })
      : await executeUserCode({
        code,
        language: normalizedLanguage,
        input: testCase.input,
      });

    totalRuntimeMs += Number.parseInt(result.runtime, 10) || 0;

    if (result.status !== 'success') {
      return buildJudgeResponse({
        status: result.executionStatus,
        runtime: `${totalRuntimeMs} ms`,
        memory: result.memory || '--',
        output: result.output,
        error: result.error,
        failedCase: index + 1,
      });
    }

    const comparisonOptions = {
      ignoreWhitespace: testCase?.comparison?.ignoreWhitespace !== false,
      unordered: Boolean(testCase?.comparison?.unordered),
    };
    const actual = normalizeOutput(result.output, comparisonOptions);
    const expected = normalizeOutput(testCase.output, comparisonOptions);
    if (actual !== expected) {
      return buildJudgeResponse({
        status: STRUCTURED_ERROR_STATUS.WA,
        runtime: `${totalRuntimeMs} ms`,
        memory: result.memory || '--',
        output: result.output,
        error: '',
        failedCase: index + 1,
      });
    }
  }

  return buildJudgeResponse({
    status: STRUCTURED_ERROR_STATUS.ACCEPTED,
    runtime: `${totalRuntimeMs} ms`,
    memory: '--',
    output: '',
    error: '',
  });
};

export const getExecutionEngineConfig = () => ({
  timeoutMs: EXECUTION_TIMEOUT_MS,
  memoryLimitMb: DEFAULT_MEMORY_LIMIT_MB,
  javaMainClass: JAVA_DEFAULT_CLASS_NAME,
  sandboxRecommendation: {
    runner: 'docker',
    networkDisabled: true,
    nonRootUser: true,
    cpuLimit: '1',
    memoryLimit: `${DEFAULT_MEMORY_LIMIT_MB}m`,
    pidsLimit: 64,
  },
});
