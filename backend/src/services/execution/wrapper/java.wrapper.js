const helperSources = {
  TreeNode: `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  TreeNode(int val) { this.val = val; }
}`,
  ListNode: `class ListNode {
  int val;
  ListNode next;
  ListNode(int val) { this.val = val; }
}`,
};

const serializeValue = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `{${value.map((item) => serializeValue(item)).join(', ')}}`;
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

const buildJavaExpression = (type, value) => {
  switch (type) {
    case 'int':
    case 'long':
    case 'double':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'String':
      return JSON.stringify(value ?? '');
    case 'int[]':
      return `new int[]${serializeValue(value)}`;
    case 'int[][]':
      return `new int[][]${serializeValue(value)}`;
    case 'String[]':
      return `new String[]${serializeValue(value)}`;
    case 'List<Integer>':
      return `new ArrayList<>(Arrays.asList(${(value || []).join(', ')}))`;
    case 'List<String>':
      return `new ArrayList<>(Arrays.asList(${(value || []).map((item) => JSON.stringify(item)).join(', ')}))`;
    case 'List<List<Integer>>':
      return `buildIntegerListMatrix(new int[][]${serializeValue(value)})`;
    case 'TreeNode':
      // If value is a plain number, it's a node reference (e.g., p=2 in LCA)
      // — find it in the tree. If it's an array, build a new tree.
      if (typeof value === 'number' || (typeof value === 'string' && /^-?\d+$/.test(String(value).trim()))) {
        return `findNode(root, ${value})`;
      }
      return `buildTreeNode(new Integer[]${serializeValue(value)})`;
    case 'ListNode':
      return `buildListNode(new int[]${serializeValue(value)})`;
    case 'Node':
      return `buildGraph(new int[][]${serializeValue(value)})`;
    default:
      // Fallback: try raw serialization for unknown types
      return serializeValue(value);
  }
};

const buildHelpers = (metadata) => {
  const helperTypes = new Set(metadata.helperTypes || []);
  (metadata.parameters || []).forEach((parameter) => {
    if (parameter.type === 'TreeNode') helperTypes.add('TreeNode');
    if (parameter.type === 'ListNode') helperTypes.add('ListNode');
    if (parameter.type === 'Node') helperTypes.add('Node');
  });
  if (metadata.returnType === 'Node') helperTypes.add('Node');

  const classes = [...helperTypes].map((type) => helperSources[type]).filter(Boolean).join('\n\n');
  const supportMethods = [];

  if (helperTypes.has('TreeNode')) {
    supportMethods.push(`
  static TreeNode buildTreeNode(Integer[] values) {
    if (values.length == 0 || values[0] == null) return null;
    TreeNode root = new TreeNode(values[0]);
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    int index = 1;
    while (!queue.isEmpty() && index < values.length) {
      TreeNode node = queue.poll();
      if (index < values.length && values[index] != null) {
        node.left = new TreeNode(values[index]);
        queue.offer(node.left);
      }
      index += 1;
      if (index < values.length && values[index] != null) {
        node.right = new TreeNode(values[index]);
        queue.offer(node.right);
      }
      index += 1;
    }
    return root;
  }

  static TreeNode findNode(TreeNode root, int val) {
    if (root == null) return null;
    if (root.val == val) return root;
    TreeNode left = findNode(root.left, val);
    if (left != null) return left;
    return findNode(root.right, val);
  }

  static String serializeTreeNode(TreeNode root) {
    if (root == null) return "[]";
    List<Integer> result = new ArrayList<>();
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
      TreeNode node = queue.poll();
      if (node != null) {
        result.add(node.val);
        queue.offer(node.left);
        queue.offer(node.right);
      } else {
        result.add(null);
      }
    }
    while (result.size() > 0 && result.get(result.size() - 1) == null) {
      result.remove(result.size() - 1);
    }
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int i = 0; i < result.size(); i++) {
        sb.append(result.get(i) == null ? "null" : result.get(i));
        if (i < result.size() - 1) sb.append(",");
    }
    sb.append("]");
    return sb.toString();
  }`);
  }

  if (helperTypes.has('ListNode')) {
    supportMethods.push(`
  static ListNode buildListNode(int[] values) {
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;
    for (int value : values) {
      tail.next = new ListNode(value);
      tail = tail.next;
    }
    return dummy.next;
  }

  static String serializeListNode(ListNode head) {
    if (head == null) return "[]";
    List<Integer> result = new ArrayList<>();
    while (head != null) {
        result.add(head.val);
        head = head.next;
    }
    return result.toString().replace(" ", "");
  }`);
  }

  if (helperTypes.has('Node')) {
    supportMethods.push(`
  static Node buildGraph(int[][] adjList) {
    if (adjList == null || adjList.length == 0) return null;
    List<Node> nodes = new ArrayList<>();
    for (int i = 0; i < adjList.length; i++) {
      nodes.add(new Node(i + 1));
    }
    for (int i = 0; i < adjList.length; i++) {
      for (int neighbor : adjList[i]) {
        nodes.get(i).neighbors.add(nodes.get(neighbor - 1));
      }
    }
    return nodes.get(0);
  }

  static String serializeGraph(Node node) {
    if (node == null) return "[]";
    List<List<Integer>> result = new ArrayList<>();
    Map<Integer, Node> visited = new TreeMap<>();
    Queue<Node> queue = new LinkedList<>();
    queue.add(node);
    visited.put(node.val, node);
    while (!queue.isEmpty()) {
      Node curr = queue.poll();
      List<Integer> neighbors = new ArrayList<>();
      for (Node n : curr.neighbors) {
        neighbors.add(n.val);
        if (!visited.containsKey(n.val)) {
          visited.put(n.val, n);
          queue.add(n);
        }
      }
      result.add(neighbors);
    }
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < result.size(); i++) {
      if (i > 0) sb.append(",");
      sb.append(result.get(i).toString().replace(" ", ""));
    }
    sb.append("]");
    return sb.toString();
  }`);
  }

  supportMethods.push(`
  static List<List<Integer>> buildIntegerListMatrix(int[][] matrix) {
    List<List<Integer>> result = new ArrayList<>();
    for (int[] row : matrix) {
      List<Integer> list = new ArrayList<>();
      for (int value : row) list.add(value);
      result.add(list);
    }
    return result;
  }

  static String formatOutput(Object value) {
    if (value == null) return "null";
    if (value instanceof int[]) return Arrays.toString((int[]) value);
    if (value instanceof int[][]) return Arrays.deepToString((int[][]) value);
    if (value instanceof Object[]) return Arrays.deepToString((Object[]) value);
    if (value instanceof List) return value.toString();
${helperTypes.has('TreeNode') ? (metadata.serializeNodeAsValue ? `    if (value instanceof TreeNode) return String.valueOf(((TreeNode) value).val);` : `    if (value instanceof TreeNode) return serializeTreeNode((TreeNode) value);`) : ''}
${helperTypes.has('ListNode') ? (metadata.serializeNodeAsValue ? `    if (value instanceof ListNode) return String.valueOf(((ListNode) value).val);` : `    if (value instanceof ListNode) return serializeListNode((ListNode) value);`) : ''}
${helperTypes.has('Node') ? `    if (value instanceof Node) return serializeGraph((Node) value);` : ''}
    return String.valueOf(value);
  }`);

  return { classes, supportMethods: supportMethods.join('\n') };
};

export const buildJavaWrapper = ({ userCode, metadata, inputValues }) => {
  const { classes, supportMethods } = buildHelpers(metadata);
  const parameterStatements = (metadata.parameters || []).map((parameter) => (
    `    ${parameter.type} ${parameter.name} = ${buildJavaExpression(parameter.type, inputValues[parameter.name])};`
  )).join('\n');

  const args = (metadata.parameters || []).map((parameter) => parameter.name).join(', ');
  const invocation = metadata.returnType === 'void'
    ? `    solution.${metadata.methodName}(${args});\n    System.out.print("");`
    : `    Object result = solution.${metadata.methodName}(${args});\n    System.out.print(formatOutput(result));`;

  const entryClass = metadata.entryClass || 'Solution';
  const isUserClassMain = entryClass === 'Main';

  // If user wrote "class Main", strip their main() and inject our harness
  const stripUserMain = (code) => {
    // Remove the user's main method (public static void main(String[] args) { ... })
    // by tracking brace depth from the method signature
    const mainRegex = /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s+\w+\s*\)\s*\{/;
    const mainMatch = mainRegex.exec(code);
    if (!mainMatch) return code;

    let depth = 1;
    let i = mainMatch.index + mainMatch[0].length;
    while (i < code.length && depth > 0) {
      if (code[i] === '{') depth++;
      if (code[i] === '}') depth--;
      i++;
    }
    return code.slice(0, mainMatch.index) + code.slice(i);
  };

  const sourceCode = isUserClassMain
    ? `import java.util.*;

${classes}

${stripUserMain(userCode).replace(/}\s*$/, '')}
${supportMethods}
  public static void main(String[] args) {
${parameterStatements}
    ${entryClass} solution = new ${entryClass}();
${invocation}
  }
}`
    : `import java.util.*;

${classes}

${userCode}

public class Main {${supportMethods}
  public static void main(String[] args) {
${parameterStatements}
    ${entryClass} solution = new ${entryClass}();
${invocation}
  }
}`;

  return {
    language: 'java',
    fileName: 'Main.java',
    image: 'java',
    sourceCode,
    compile: 'javac Main.java',
    run: 'java -cp . Main',
  };
};