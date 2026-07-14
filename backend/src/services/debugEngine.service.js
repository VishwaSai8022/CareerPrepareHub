/**
 * debugEngine.service.js
 *
 * Deterministic code-execution debug engine for CareerPrepHub.
 * Classifies errors → diagnoses root cause → returns structured fix report.
 * No external LLM dependency — entirely pattern-matching based.
 */

// ─── Error classification ───────────────────────────────────────────────────

const STATUS = Object.freeze({
  COMPILATION: 'Compilation Error',
  RUNTIME: 'Runtime Error',
  TLE: 'Time Limit Exceeded',
  WA: 'Wrong Answer',
  INTERNAL: 'Internal Server Error',
  ACCEPTED: 'Accepted',
});

const classifyError = (status = '', errorLog = '') => {
  const s = String(status).trim().toLowerCase();
  const log = String(errorLog).toLowerCase();

  if (s.includes('compilation') || s.includes('compile'))   return STATUS.COMPILATION;
  if (s.includes('time limit'))                               return STATUS.TLE;
  if (s.includes('wrong answer'))                             return STATUS.WA;
  if (s.includes('runtime'))                                  return STATUS.RUNTIME;
  if (s.includes('internal') || s.includes('server error'))   return STATUS.INTERNAL;

  // fallback: sniff the error log text
  if (log.includes('error:') && (log.includes('expected') || log.includes('cannot find symbol')))
    return STATUS.COMPILATION;
  if (log.includes('segmentation fault') || log.includes('nullpointerexception') ||
      log.includes('indexoutofboundsexception') || log.includes('zerodivisionerror') ||
      log.includes('typeerror') || log.includes('nameerror') ||
      log.includes('arithmeticexception') || log.includes('stackoverflow'))
    return STATUS.RUNTIME;
  if (log.includes('time limit') || log.includes('timed out'))
    return STATUS.TLE;
  if (log.includes('internal server'))
    return STATUS.INTERNAL;

  return STATUS.RUNTIME; // safe default for unknown errors
};

// ─── Language-specific helpers ──────────────────────────────────────────────

const LANG = { JAVA: 'java', PYTHON: 'python', C: 'c', CPP: 'cpp', JS: 'javascript' };

const normalizeLang = (lang = '') => {
  const l = String(lang).trim().toLowerCase();
  if (l === 'c++') return 'cpp';
  return l;
};

// ─── Compilation error diagnosis ─────────────────────────────────────────────

const COMPILATION_PATTERNS = {
  java: [
    { regex: /error: ';' expected/i,      tip: 'Missing semicolon',              fix: 'Add a semicolon at the end of the statement.' },
    { regex: /error: cannot find symbol/i, tip: 'Undeclared variable or method',  fix: 'Check spelling or import the correct class.' },
    { regex: /error: incompatible types/i, tip: 'Type mismatch',                 fix: 'Cast or convert to the expected type.' },
    { regex: /error: class .+ is public, should be declared in a file named/i, tip: 'Class name doesn\'t match file name', fix: 'Rename the class to Main (required by this platform).' },
    { regex: /error: reached end of file while parsing/i, tip: 'Missing closing brace', fix: 'Add the missing } at the end of the class or method.' },
    { regex: /error: illegal start of expression/i, tip: 'Syntax error', fix: 'Check for misplaced keywords, extra/missing parentheses or braces.' },
    { regex: /error: \) expected/i, tip: 'Missing parenthesis', fix: 'Add the missing closing parenthesis.' },
    { regex: /error: unclosed string literal/i, tip: 'Unclosed string', fix: 'Close the string literal with a matching quote.' },
    { regex: /error: package .+ does not exist/i, tip: 'Missing import', fix: 'Add the correct import statement at the top of your code.' },
  ],
  python: [
    { regex: /SyntaxError: (invalid syntax|unexpected EOF)/i, tip: 'Syntax error', fix: 'Check for missing colons, parentheses, or incorrect indentation.' },
    { regex: /IndentationError/i, tip: 'Indentation error', fix: 'Use consistent 4-space indentation. Never mix tabs and spaces.' },
    { regex: /ModuleNotFoundError|ImportError/i, tip: 'Missing module', fix: 'The module is not available in the sandbox. Use only standard library modules.' },
    { regex: /TabError/i, tip: 'Tab/space mix', fix: 'Replace all tabs with 4 spaces.' },
  ],
  c: [
    { regex: /error: expected ';'/i, tip: 'Missing semicolon', fix: 'Add a semicolon at the end of the statement.' },
    { regex: /error: implicit declaration of function/i, tip: 'Missing #include', fix: 'Add the appropriate #include header (e.g. #include <stdio.h>).' },
    { regex: /error: expected '[\)}\]]'/i, tip: 'Missing bracket', fix: 'Add the missing bracket or parenthesis.' },
    { regex: /error: undeclared/i, tip: 'Undeclared variable', fix: 'Declare the variable before using it.' },
    { regex: /error: conflicting types/i, tip: 'Type conflict', fix: 'Fix the function prototype to match the definition.' },
  ],
  cpp: [
    { regex: /error: expected ';'/i, tip: 'Missing semicolon', fix: 'Add a semicolon at the end of the statement.' },
    { regex: /error: use of undeclared identifier/i, tip: 'Undeclared identifier', fix: 'Declare the variable or include the correct header.' },
    { regex: /error: no matching function/i, tip: 'No matching function', fix: 'Check argument types and count passed to the function.' },
    { regex: /error: expected '[\)}\]]'/i, tip: 'Missing bracket', fix: 'Add the missing bracket or parenthesis.' },
    { regex: /error: .*was not declared in this scope/i, tip: 'Undeclared variable', fix: 'Declare the variable or include the correct header/namespace.' },
  ],
  javascript: [
    { regex: /SyntaxError: Unexpected token/i, tip: 'Unexpected token', fix: 'Check for missing commas, brackets, or parentheses.' },
    { regex: /SyntaxError: Unexpected end of input/i, tip: 'Premature end', fix: 'Add the missing closing bracket, brace, or parenthesis.' },
    { regex: /SyntaxError: .* is not defined/i, tip: 'Undefined reference', fix: 'Define the variable or function before using it.' },
  ],
};

const diagnoseCompilation = (errorLog, code, language) => {
  const patterns = COMPILATION_PATTERNS[language] || [];
  const log = String(errorLog);

  // Extract line number if present
  const lineMatch = log.match(/:(\d+)(?::(\d+))?.*error/i) || log.match(/line (\d+)/i);
  const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : null;

  for (const pattern of patterns) {
    if (pattern.regex.test(log)) {
      return {
        rootCause: pattern.tip,
        detail: pattern.fix,
        line: lineNumber,
      };
    }
  }

  return {
    rootCause: 'Compilation failed — syntax or type error detected',
    detail: `Review the compiler output: ${log.slice(0, 300)}`,
    line: lineNumber,
  };
};

// ─── Runtime error diagnosis ────────────────────────────────────────────────

const RUNTIME_PATTERNS = [
  { regex: /NullPointerException/i,        rootCause: 'Null pointer dereference',        fix: 'Add null checks before accessing object properties or methods.' },
  { regex: /ArrayIndexOutOfBoundsException/i, rootCause: 'Array index out of bounds',    fix: 'Validate that the index is within 0..array.length-1 before accessing.' },
  { regex: /IndexOutOfBoundsException/i,   rootCause: 'Index out of bounds',             fix: 'Check list/array size before accessing by index.' },
  { regex: /StringIndexOutOfBoundsException/i, rootCause: 'String index out of range',   fix: 'Validate index is within 0..str.length()-1.' },
  { regex: /StackOverflowError/i,          rootCause: 'Stack overflow (infinite recursion)', fix: 'Add a proper base case to your recursive function or convert to iterative.' },
  { regex: /ArithmeticException.*\/ by zero/i, rootCause: 'Division by zero',            fix: 'Check that the divisor is not zero before dividing.' },
  { regex: /ClassCastException/i,          rootCause: 'Invalid type cast',               fix: 'Use instanceof check before casting.' },
  { regex: /NumberFormatException/i,       rootCause: 'Invalid number format',           fix: 'Validate the string is a valid number before parsing.' },
  { regex: /ConcurrentModificationException/i, rootCause: 'Concurrent modification',    fix: 'Use an Iterator or collect modifications and apply after the loop.' },
  { regex: /OutOfMemoryError/i,            rootCause: 'Out of memory',                   fix: 'Reduce data structure sizes or use streaming/iterative approaches.' },
  // Python
  { regex: /ZeroDivisionError/i,           rootCause: 'Division by zero',                fix: 'Check that the divisor is not zero before dividing.' },
  { regex: /IndexError: list index out of range/i, rootCause: 'List index out of range', fix: 'Check len(list) before accessing by index.' },
  { regex: /KeyError/i,                    rootCause: 'Missing dictionary key',          fix: 'Use dict.get(key, default) or check "if key in dict" first.' },
  { regex: /TypeError/i,                   rootCause: 'Type error — wrong argument type', fix: 'Ensure variables have the expected types (int, str, list, etc.).' },
  { regex: /NameError/i,                   rootCause: 'Undefined variable or function',  fix: 'Define or import the name before using it.' },
  { regex: /AttributeError/i,             rootCause: 'Attribute does not exist',         fix: 'Check the object type and verify the attribute/method name.' },
  { regex: /RecursionError/i,             rootCause: 'Maximum recursion depth exceeded', fix: 'Add a base case or convert to iterative. You can also use sys.setrecursionlimit().' },
  { regex: /ValueError/i,                 rootCause: 'Invalid value',                    fix: 'Validate input format before converting (e.g., int("abc") fails).' },
  { regex: /FileNotFoundError/i,          rootCause: 'File not found',                   fix: 'File I/O is not supported in the sandbox. Use stdin for input.' },
  // C / C++
  { regex: /segmentation fault/i,         rootCause: 'Segmentation fault — dereferencing invalid pointer', fix: 'Check for null pointers, array bounds, and uninitialized pointers.' },
  { regex: /double free or corruption/i,  rootCause: 'Double free — memory corruption', fix: 'Set pointer to NULL after freeing and don\'t free twice.' },
  { regex: /abort/i,                      rootCause: 'Program aborted',                  fix: 'Check for assertion failures or exception handling issues.' },
  // JavaScript
  { regex: /ReferenceError/i,             rootCause: 'Undefined reference',              fix: 'Define or declare the variable before using it.' },
  { regex: /RangeError: Maximum call stack/i, rootCause: 'Stack overflow (infinite recursion)', fix: 'Add a base case to your recursion or convert to iterative.' },
];

const diagnoseRuntime = (errorLog, code, language) => {
  const log = String(errorLog);

  for (const pattern of RUNTIME_PATTERNS) {
    if (pattern.regex.test(log)) {
      return {
        rootCause: pattern.rootCause,
        detail: pattern.fix,
      };
    }
  }

  return {
    rootCause: 'Runtime error — program crashed during execution',
    detail: `Check the error output: ${log.slice(0, 300)}`,
  };
};

// ─── Wrong Answer diagnosis ─────────────────────────────────────────────────

const diagnoseWrongAnswer = (actual, expected, code, language) => {
  const a = String(actual || '').trim();
  const e = String(expected || '').trim();

  // Whitespace difference
  if (a.replace(/\s+/g, '') === e.replace(/\s+/g, '')) {
    return {
      rootCause: 'Output format mismatch — extra/missing whitespace or newlines',
      detail: 'Your logic is correct but the output formatting differs. Check for trailing spaces, extra newlines, or missing separators.',
      changes: ['Fix output formatting to match expected whitespace exactly.'],
    };
  }

  // Case difference
  if (a.toLowerCase() === e.toLowerCase()) {
    return {
      rootCause: 'Case mismatch in output',
      detail: 'Your answer is correct but the letter casing is wrong (e.g., "Yes" vs "yes").',
      changes: ['Match the exact casing required by the problem statement.'],
    };
  }

  // Off-by-one (numeric)
  const aNum = Number(a);
  const eNum = Number(e);
  if (!isNaN(aNum) && !isNaN(eNum)) {
    if (Math.abs(aNum - eNum) === 1) {
      return {
        rootCause: 'Off-by-one error in the result',
        detail: `Your output is ${aNum} but expected ${eNum}. Check loop boundaries (< vs <=, start index 0 vs 1).`,
        changes: ['Review loop bounds and condition checks for off-by-one errors.'],
      };
    }
    // Integer overflow check
    if (Math.abs(aNum) > 2_147_483_647 || Math.abs(eNum) > 2_147_483_647) {
      return {
        rootCause: 'Possible integer overflow — value exceeds 32-bit int range',
        detail: 'Use long (Java), long long (C/C++), or Python handles big integers automatically.',
        changes: ['Change int to long/long long for large value accumulations.'],
      };
    }
  }

  // Trailing newline difference
  if (a + '\n' === e || a === e + '\n') {
    return {
      rootCause: 'Trailing newline difference',
      detail: 'One output has an extra trailing newline. Use print() carefully.',
      changes: ['Ensure consistent trailing newline in output.'],
    };
  }

  // Bracket formatting
  if (a.replace(/[\[\],\s]/g, '') === e.replace(/[\[\],\s]/g, '')) {
    return {
      rootCause: 'Array/list formatting mismatch',
      detail: 'The values are correct but the formatting differs (brackets, commas, spaces).',
      changes: ['Format list output to match the expected pattern exactly (e.g., [1, 2, 3] vs 1 2 3).'],
    };
  }

  return {
    rootCause: 'Logical error — algorithm produces wrong result',
    detail: `Expected "${e.slice(0, 120)}" but got "${a.slice(0, 120)}". Trace through your algorithm step by step with the sample input.`,
    changes: ['Review the core algorithm logic for correctness.'],
  };
};

// ─── TLE diagnosis ──────────────────────────────────────────────────────────

const diagnoseTLE = (code, language) => {
  const src = String(code);
  const changes = [];
  let rootCause = 'Program exceeded the time limit';
  let detail = '';

  // Detect nested loops (O(n²))
  const nestedLoopCount = (src.match(/for\s*\(/g) || []).length;
  if (nestedLoopCount >= 2) {
    rootCause = 'O(n²) or worse complexity from nested loops';
    detail = 'Nested loops over large input cause quadratic time. Consider sorting + two pointers, hash maps, or binary search.';
    changes.push('Replace nested loops with a more efficient algorithm (O(n log n) or O(n)).');
  }

  // Detect recursion without memoization
  if (/def\s+\w+\(.*\)[\s\S]*?\1\(/m.test(src) || /void\s+\w+\([\s\S]*?\1\(/m.test(src)) {
    rootCause = 'Recursive solution without memoization';
    detail = 'Recursive calls without caching lead to exponential time. Add memoization or convert to dynamic programming.';
    changes.push('Add memoization (HashMap/dict) or convert to iterative DP.');
  }

  // String concatenation in loop
  if (language === 'java' && /for.*\{[\s\S]*?\+=/m.test(src) && /String\s+\w+/m.test(src)) {
    changes.push('Use StringBuilder instead of String concatenation in loops.');
  }
  if (language === 'python' && /for.*:[\s\S]*?\+=/m.test(src)) {
    changes.push('Collect strings in a list and use "".join() instead of += in a loop.');
  }

  if (!detail) {
    detail = 'The algorithm is too slow for the given constraints. Optimize the time complexity.';
  }

  return { rootCause, detail, changes };
};

// ─── Internal server error diagnosis ────────────────────────────────────────

const diagnoseInternal = (errorLog, code, language) => {
  const log = String(errorLog).toLowerCase();
  const src = String(code);

  // Missing stdin
  const readsInput = {
    java: /Scanner|BufferedReader|System\.in|readLine/i.test(src),
    python: /input\s*\(/i.test(src),
    c: /scanf|fgets|getchar|gets/i.test(src),
    cpp: /cin\s*>>|getline|scanf/i.test(src),
    javascript: /readline|process\.stdin/i.test(src),
  };

  if (readsInput[language]) {
    return {
      rootCause: 'Code reads from stdin but no input was provided',
      detail: 'Your code expects input from stdin. Provide test input in the Custom Input box, or use hardcoded values for testing.',
      changes: ['Provide appropriate stdin input matching the expected format.'],
    };
  }

  // Missing output
  const hasOutput = {
    java: /System\.out\.(print|println)|System\.out\.printf/i.test(src),
    python: /print\s*\(/i.test(src),
    c: /printf|puts|fputs|putchar/i.test(src),
    cpp: /cout\s*<</i.test(src),
    javascript: /console\.log|process\.stdout/i.test(src),
  };

  if (!hasOutput[language]) {
    return {
      rootCause: 'No output statement found in code',
      detail: `Your code doesn't print any output. Add ${language === 'java' ? 'System.out.println()' : language === 'python' ? 'print()' : language === 'c' || language === 'cpp' ? 'printf() / cout' : 'console.log()'} to produce output.`,
      changes: ['Add a print/output statement to display the result.'],
    };
  }

  // Java: class must be Main
  if (language === 'java' && !/public\s+class\s+Main/m.test(src)) {
    const classMatch = src.match(/public\s+class\s+(\w+)/m);
    return {
      rootCause: `Java class must be named "Main" but found "${classMatch?.[1] || 'unknown'}"`,
      detail: 'This platform requires your Java class to be named "Main" with a "public static void main(String[] args)" method.',
      changes: ['Rename the public class to "Main".'],
    };
  }

  // Unsupported libraries
  const unsupported = [
    /import\s+tkinter/i, /import\s+pygame/i, /import\s+matplotlib/i,
    /import\s+javafx/i, /import\s+javax\.swing/i,
    /#include\s*<SDL/i, /#include\s*<graphics\.h>/i,
  ];
  for (const lib of unsupported) {
    if (lib.test(src)) {
      return {
        rootCause: 'Unsupported library — not available in the sandbox',
        detail: 'GUI and graphics libraries are not available in the online sandbox. Use only console I/O.',
        changes: ['Remove the unsupported library import and use standard I/O instead.'],
      };
    }
  }

  // Infinite loop detection (heuristic)
  if (/while\s*\(\s*true\s*\)|while\s*\(\s*1\s*\)|for\s*\(\s*;\s*;\s*\)/i.test(src)) {
    if (!/break/i.test(src)) {
      return {
        rootCause: 'Possible infinite loop — while(true) without a break statement',
        detail: 'Your code contains an infinite loop with no exit condition. Add a break or termination condition.',
        changes: ['Add a break statement or loop termination condition.'],
      };
    }
  }

  return {
    rootCause: 'Internal server error — platform-level issue',
    detail: 'The execution engine encountered an internal error. This may be a platform issue. Try again or simplify your code.',
    changes: ['Retry execution. If the error persists, check for infinite loops or excessive memory usage.'],
  };
};

// ─── Code fixer (applies common automatic fixes) ────────────────────────────

const applyAutoFix = (code, language, errorType, errorLog) => {
  let fixed = String(code);
  const changes = [];

  if (errorType === STATUS.COMPILATION) {
    // Java: fix missing semicolons (best-effort on the flagged line)
    if (language === 'java') {
      const lineMatch = String(errorLog).match(/:(\d+):.*';' expected/i);
      if (lineMatch) {
        const lineNum = parseInt(lineMatch[1], 10);
        const lines = fixed.split('\n');
        if (lineNum > 0 && lineNum <= lines.length) {
          const targetLine = lines[lineNum - 1];
          if (!targetLine.trimEnd().endsWith(';') && !targetLine.trimEnd().endsWith('{') && !targetLine.trimEnd().endsWith('}')) {
            lines[lineNum - 1] = targetLine.trimEnd() + ';';
            fixed = lines.join('\n');
            changes.push(`Line ${lineNum}: added missing semicolon.`);
          }
        }
      }

      // Fix class name to Main
      if (/class .+ is public, should be declared in a file named/i.test(errorLog)) {
        fixed = fixed.replace(/public\s+class\s+\w+/, 'public class Main');
        changes.push('Renamed public class to Main (required by platform).');
      }
    }

    // Python: fix tab/space indentation
    if (language === 'python' && /IndentationError|TabError/i.test(errorLog)) {
      fixed = fixed.replace(/\t/g, '    ');
      changes.push('Replaced all tabs with 4 spaces.');
    }
  }

  if (errorType === STATUS.RUNTIME) {
    // Java: add null checks for tree traversal
    if (language === 'java' && /NullPointerException/i.test(errorLog)) {
      if (/\.val\b/.test(fixed) && !/if\s*\(\s*\w+\s*!=\s*null/.test(fixed)) {
        changes.push('Guard: add null checks before accessing .val, .left, .right on TreeNode.');
      }
    }

    // Python: guard division by zero
    if (language === 'python' && /ZeroDivisionError/i.test(errorLog)) {
      changes.push('Guard: check divisor != 0 before performing division.');
    }

    // C/C++: segfault guard
    if ((language === 'c' || language === 'cpp') && /segmentation fault/i.test(errorLog)) {
      changes.push('Guard: check pointer != NULL before dereferencing. Validate array indices.');
    }
  }

  return { fixedCode: fixed, changes };
};

// ─── Main diagnosis entry point ─────────────────────────────────────────────

export const diagnoseAndFix = ({
  language: rawLanguage,
  code = '',
  stdin = '',
  expectedOutput = '',
  actualOutput = '',
  executionResult = '',
  errorLog = '',
  status = '',
}) => {
  const language = normalizeLang(rawLanguage);
  const errorType = classifyError(status, errorLog);

  let diagnosis;
  switch (errorType) {
    case STATUS.COMPILATION:
      diagnosis = diagnoseCompilation(errorLog, code, language);
      break;
    case STATUS.RUNTIME:
      diagnosis = diagnoseRuntime(errorLog, code, language);
      break;
    case STATUS.WA:
      diagnosis = diagnoseWrongAnswer(actualOutput, expectedOutput, code, language);
      break;
    case STATUS.TLE:
      diagnosis = diagnoseTLE(code, language);
      break;
    case STATUS.INTERNAL:
      diagnosis = diagnoseInternal(errorLog, code, language);
      break;
    default:
      diagnosis = { rootCause: 'Unknown error', detail: 'Unable to classify the error type.' };
  }

  // Attempt auto-fix
  const { fixedCode, changes: autoChanges } = applyAutoFix(code, language, errorType, errorLog);
  const allChanges = [
    ...(diagnosis.changes || []),
    ...autoChanges,
  ];

  // Build prevention tips
  const preventionTips = {
    [STATUS.COMPILATION]: [
      'Always compile/run locally before submitting to catch syntax errors early.',
      'Use an IDE with real-time error highlighting.',
    ],
    [STATUS.RUNTIME]: [
      'Add defensive null/bounds checks before accessing arrays, lists, or object properties.',
      'Test with edge cases: empty input, single element, maximum constraints.',
    ],
    [STATUS.WA]: [
      'Trace through your algorithm with the sample input step by step on paper.',
      'Watch out for integer overflow — use long/long long for large accumulations.',
    ],
    [STATUS.TLE]: [
      'Analyze your solution\'s time complexity before submitting. Aim for O(n log n) or better.',
      'Replace brute-force nested loops with hash maps, sorting, or binary search.',
    ],
    [STATUS.INTERNAL]: [
      'Ensure your code uses only standard library modules available in online judges.',
      'Always provide stdin input when your code reads from it.',
    ],
  };

  return {
    errorType,
    rootCause: diagnosis.rootCause || 'Error detected',
    fixedCode: fixedCode || code,
    whatChanged: allChanges.length > 0 ? allChanges : ['Review the root cause and apply the suggested fix manually.'],
    whyItHappened: diagnosis.detail || 'The program encountered an error during execution.',
    howToPrevent: (preventionTips[errorType] || preventionTips[STATUS.RUNTIME])[0],
    line: diagnosis.line || null,
  };
};

export default { diagnoseAndFix };
