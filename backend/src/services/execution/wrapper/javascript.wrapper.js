const toJavascriptLiteral = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map((item) => toJavascriptLiteral(item)).join(', ')}]`;
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

export const buildJavascriptWrapper = ({ userCode, metadata, inputValues }) => {
  const helperTypes = new Set(metadata.helperTypes || []);
  (metadata.parameters || []).forEach((parameter) => {
    if (parameter.type === 'TreeNode') helperTypes.add('TreeNode');
    if (parameter.type === 'ListNode') helperTypes.add('ListNode');
  });

  const helperCode = `${helperTypes.has('TreeNode') ? `
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
function buildTree(values) {
  if (!values.length || values[0] == null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let index = 1;
  while (queue.length && index < values.length) {
    const node = queue.shift();
    if (values[index] != null) {
      node.left = new TreeNode(values[index]);
      queue.push(node.left);
    }
    index += 1;
    if (index < values.length && values[index] != null) {
      node.right = new TreeNode(values[index]);
      queue.push(node.right);
    }
    index += 1;
  }
  return root;
}
function findNode(root, val) {
  if (!root) return null;
  if (root.val === val) return root;
  const left = findNode(root.left, val);
  if (left) return left;
  return findNode(root.right, val);
}
function serializeTree(root) {
  if (!root) return '[]';
  const result = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (node) {
      result.push(node.val);
      queue.push(node.left);
      queue.push(node.right);
    } else {
      result.push(null);
    }
  }
  while (result.length && result[result.length - 1] === null) {
    result.pop();
  }
  return '[' + result.map(String).join(',') + ']';
}` : ''}
${helperTypes.has('ListNode') ? `
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}
function buildList(values) {
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const value of values) {
    tail.next = new ListNode(value);
    tail = tail.next;
  }
  return dummy.next;
}
function serializeList(head) {
  if (!head) return '[]';
  const result = [];
  while (head) {
    result.push(head.val);
    head = head.next;
  }
  return '[' + result.join(',') + ']';
}` : ''}

function formatOutput(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return '[' + value.map(formatOutput).join(',') + ']';
${helperTypes.has('TreeNode') ? (metadata.serializeNodeAsValue ? `  if (value instanceof TreeNode) return String(value.val);` : `  if (value instanceof TreeNode) return serializeTree(value);`) : ''}
${helperTypes.has('ListNode') ? (metadata.serializeNodeAsValue ? `  if (value instanceof ListNode) return String(value.val);` : `  if (value instanceof ListNode) return serializeList(value);`) : ''}
  return String(value);
}`;

  const parameterStatements = (metadata.parameters || []).map((parameter) => {
    const value = inputValues[parameter.name];
    const literal = toJavascriptLiteral(value);
    if (parameter.type === 'TreeNode') {
      if (typeof value === 'number') return `const ${parameter.name} = findNode(root, ${value});`;
      return `const ${parameter.name} = buildTree(${literal});`;
    }
    if (parameter.type === 'ListNode') return `const ${parameter.name} = buildList(${literal});`;
    return `const ${parameter.name} = ${literal};`;
  }).join('\n');

  const args = (metadata.parameters || []).map((parameter) => parameter.name).join(', ');

  return {
    language: 'javascript',
    fileName: 'main.js',
    image: 'javascript',
    sourceCode: `${helperCode}

${userCode}

${parameterStatements}
const solution = ${userCode.includes(`class ${metadata.entryClass || 'Solution'}`) ? `new ${(metadata.entryClass || 'Solution')}();` : 'null;'}
${metadata.returnType === 'void' ? `if (solution) solution.${metadata.methodName}(${args}); else ${metadata.methodName}(${args});
process.stdout.write('');` : `const result = solution ? solution.${metadata.methodName}(${args}) : ${metadata.methodName}(${args});
process.stdout.write(formatOutput(result));`}
`,
    compile: '',
    run: 'node main.js',
  };
};