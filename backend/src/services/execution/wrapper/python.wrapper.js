const toPythonLiteral = (value) => {
  if (value === null) return 'None';
  if (Array.isArray(value)) return `[${value.map((item) => toPythonLiteral(item)).join(', ')}]`;
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return String(value);
};

export const buildPythonWrapper = ({ userCode, metadata, inputValues }) => {
  const helperTypes = new Set(metadata.helperTypes || []);
  (metadata.parameters || []).forEach((parameter) => {
    if (parameter.type === 'TreeNode') helperTypes.add('TreeNode');
    if (parameter.type === 'ListNode') helperTypes.add('ListNode');
  });

  const helperCode = `${helperTypes.has('TreeNode') ? `
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(values):
    if not values or values[0] is None:
        return None
    nodes = [TreeNode(values[0])]
    root = nodes[0]
    index = 1
    for node in nodes:
        if index < len(values) and values[index] is not None:
            node.left = TreeNode(values[index])
            nodes.append(node.left)
        index += 1
        if index < len(values) and values[index] is not None:
            node.right = TreeNode(values[index])
            nodes.append(node.right)
        index += 1
        if index >= len(values):
            break
    return root

def find_node(root, val):
    if root is None:
        return None
    if root.val == val:
        return root
    left = find_node(root.left, val)
    if left is not None:
        return left
    return find_node(root.right, val)

def serialize_tree(root):
    if not root:
        return "[]"
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    
    return "[" + ",".join("null" if x is None else str(x) for x in result) + "]"
` : ''}
${helperTypes.has('ListNode') ? `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(values):
    dummy = ListNode(0)
    tail = dummy
    for value in values:
        tail.next = ListNode(value)
        tail = tail.next
    return dummy.next

def serialize_list(head):
    if not head:
        return "[]"
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return "[" + ",".join(str(x) for x in result) + "]"

` : ''}

def format_output(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, list):
        return "[" + ",".join(format_output(x) for x in value) + "]"
${helperTypes.has('TreeNode') ? (metadata.serializeNodeAsValue ? `    if isinstance(value, TreeNode): return str(value.val)` : `    if isinstance(value, TreeNode): return serialize_tree(value)`) : ''}
${helperTypes.has('ListNode') ? (metadata.serializeNodeAsValue ? `    if isinstance(value, ListNode): return str(value.val)` : `    if isinstance(value, ListNode): return serialize_list(value)`) : ''}
    return str(value)`;

  const parameterStatements = (metadata.parameters || []).map((parameter) => {
    const value = inputValues[parameter.name];
    const literal = toPythonLiteral(value);
    if (parameter.type === 'TreeNode') {
      // If value is a plain number, it's a node reference (e.g., p=2 in LCA)
      if (typeof value === 'number') return `${parameter.name} = find_node(root, ${value})`;
      return `${parameter.name} = build_tree(${literal})`;
    }
    if (parameter.type === 'ListNode') return `${parameter.name} = build_list(${literal})`;
    return `${parameter.name} = ${literal}`;
  }).join('\n');

  const args = (metadata.parameters || []).map((parameter) => parameter.name).join(', ');
  const target = metadata.entryClass || 'Solution';

  return {
    language: 'python',
    fileName: 'main.py',
    image: 'python',
    sourceCode: `import sys

${helperCode}

${userCode}

${parameterStatements}
solution = ${target}()
${metadata.returnType === 'void' ? `solution.${metadata.methodName}(${args})\nsys.stdout.write("")` : `result = solution.${metadata.methodName}(${args})\nsys.stdout.write(format_output(result))`}
`,
    compile: '',
    run: 'python main.py',
  };
};