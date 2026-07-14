const toCppLiteral = (value) => {
  if (Array.isArray(value)) return `{${value.map((item) => toCppLiteral(item)).join(', ')}}`;
  if (value === null) return 'INT_MIN';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

const typeMap = {
  int: 'int',
  long: 'long long',
  double: 'double',
  boolean: 'bool',
  String: 'string',
  'int[]': 'vector<int>',
  'int[][]': 'vector<vector<int>>',
  'List<Integer>': 'vector<int>',
  'List<List<Integer>>': 'vector<vector<int>>',
};

export const buildCppWrapper = ({ userCode, metadata, inputValues }) => {
  const parameterStatements = (metadata.parameters || []).map((parameter) => {
    if (parameter.type === 'TreeNode' || parameter.type === 'ListNode') {
      throw new Error(`C++ wrapper currently requires explicit metadata extensions for type ${parameter.type}`);
    }
    return `    ${typeMap[parameter.type] || parameter.type} ${parameter.name} = ${toCppLiteral(inputValues[parameter.name])};`;
  }).join('\n');

  const args = (metadata.parameters || []).map((parameter) => parameter.name).join(', ');
  return {
    language: 'cpp',
    fileName: 'main.cpp',
    image: 'cpp',
    sourceCode: `#include <bits/stdc++.h>
using namespace std;

${userCode}

template <typename T>
string formatOutput(const T& value) {
  std::ostringstream oss;
  oss << value;
  return oss.str();
}

template <typename T>
string formatVector(const vector<T>& values) {
  string result = "[";
  for (size_t i = 0; i < values.size(); ++i) {
    if (i) result += ", ";
    result += formatOutput(values[i]);
  }
  result += "]";
  return result;
}

int main() {
${parameterStatements}
    ${metadata.entryClass || 'Solution'} solution;
${metadata.returnType === 'void' ? `    solution.${metadata.methodName}(${args});
    cout << "";` : `    auto result = solution.${metadata.methodName}(${args});
    if constexpr (std::is_same_v<decltype(result), vector<int>>) cout << formatVector(result);
    else if constexpr (std::is_same_v<decltype(result), vector<vector<int>>>) {
      cout << "[";
      for (size_t i = 0; i < result.size(); ++i) {
        if (i) cout << ", ";
        cout << formatVector(result[i]);
      }
      cout << "]";
    } else cout << formatOutput(result);`}
    return 0;
}`,
    compile: 'g++ main.cpp -O2 -std=c++17 -o main',
    run: './main',
  };
};