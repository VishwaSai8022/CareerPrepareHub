/**
 * fill-sourceid-gaps.js
 * ---------------------------------------------------------------
 * Fills the gap sourceIds within 358–447 using the question data
 * that was originally imported at sourceIds 448–479.
 *
 * Workflow:
 *  1. Query the DB to discover which sourceIds in 358–447 are missing
 *  2. Take the rawQuestions array (same data as import-new-coding-questions.js)
 *  3. Reassign their sourceIds to the discovered gaps (sequential mapping)
 *  4. Upsert each document — never touches existing questions
 *  5. Log a final integrity report
 *
 * Run with:  node scripts/fill-sourceid-gaps.js
 */

import connectDB from '../src/config/db.js';
import CodingQuestion from '../src/models/codingQuestion.model.js';

// ── Constants ──────────────────────────────────────────────────────────────────
const SOURCE_ID_MIN = 358;
const SOURCE_ID_MAX = 447;

// ── Helpers ────────────────────────────────────────────────────────────────────
const normalizeDifficulty = (value = 'easy') => {
  const n = String(value).trim().toLowerCase();
  return ['easy', 'medium', 'hard'].includes(n) ? n : 'easy';
};

const normalizeTopic = (value = 'General') => {
  const n = String(value || 'General').trim();
  const map = { LinkedList: 'Linked List', HashMap: 'Hash Map' };
  return map[n] || n || 'General';
};

const normalizeTestCases = (testCases = [], sampleInput = '', sampleOutput = '') => {
  const cleaned = testCases
    .filter((tc) => tc && typeof tc === 'object')
    .map((tc) => ({
      input: String(tc.input ?? '').trim(),
      output: String(tc.output ?? '').trim(),
      isHidden: Boolean(tc.isHidden),
    }))
    .filter((tc) => tc.input.length || tc.output.length);

  return cleaned.length
    ? cleaned
    : [{ input: String(sampleInput || '').trim(), output: String(sampleOutput || '').trim(), isHidden: false }];
};

const buildDocument = (question, overrideSourceId) => ({
  sourceId: overrideSourceId,
  company: String(question.company || 'General').trim() || 'General',
  topic: normalizeTopic(question.topic),
  category: normalizeTopic(question.category || question.topic),
  title: String(question.title || 'Untitled Coding Question').trim(),
  description: String(question.description || question.title || 'No description provided.').trim(),
  constraints: String(question.constraints || '').trim(),
  sampleInput: String(question.sampleInput || '').trim(),
  sampleOutput: String(question.sampleOutput || '').trim(),
  explanation: String(question.explanation || '').trim(),
  hints: Array.isArray(question.hints)
    ? question.hints.map((h) => String(h).trim()).filter(Boolean)
    : [],
  difficulty: normalizeDifficulty(question.difficulty),
  testCases: normalizeTestCases(question.testCases, question.sampleInput, question.sampleOutput),
  isPremium: Boolean(question.isPremium),
});

// ── Raw question pool (originally at sourceIds 448–479) ───────────────────────
// These questions have proper hidden test cases (isHidden: true) and were
// deleted during the sourceId overflow fix. They are re-imported here with
// corrected sourceIds that fill the gaps within 358–447.
const rawQuestions = [
  {
    company: 'Google', topic: 'Arrays', category: 'Arrays',
    title: 'Find Peak Element',
    description: 'A peak element is an element that is strictly greater than its neighbors. Given an array nums, find a peak element and return its index.',
    constraints: '1 <= nums.length <= 1000\n-2^31 <= nums[i] <= 2^31 - 1\nnums[i] != nums[i + 1] for all valid i',
    sampleInput: 'nums = [1,2,3,1]', sampleOutput: '2',
    explanation: '3 is a peak element and your function should return the index number 2.',
    hints: ['Use binary search', 'Compare middle element with its neighbors'],
    difficulty: 'easy',
    testCases: [
      { input: 'nums = [1,2,3,1]', output: '2', isHidden: false },
      { input: 'nums = [1]', output: '0', isHidden: true },
      { input: 'nums = [1,2]', output: '1', isHidden: true },
      { input: 'nums = [2,1]', output: '0', isHidden: true },
      { input: 'nums = [1,2,1,3,5,6,4]', output: '5', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Amazon', topic: 'Strings', category: 'Strings',
    title: 'Valid Palindrome',
    description: 'Given a string s, return true if it is a palindrome, considering only alphanumeric characters and ignoring cases.',
    constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters',
    sampleInput: 's = "A man, a plan, a canal: Panama"', sampleOutput: 'true',
    explanation: 'After removing non-alphanumeric chars: "amanaplanacanalpanama" is a palindrome.',
    hints: ['Use two pointers from both ends', 'Skip non-alphanumeric characters'],
    difficulty: 'easy',
    testCases: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', isHidden: false },
      { input: 's = "race a car"', output: 'false', isHidden: true },
      { input: 's = " "', output: 'true', isHidden: true },
      { input: 's = "0P"', output: 'false', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Microsoft', topic: 'Arrays', category: 'Arrays',
    title: 'Move Zeroes',
    description: 'Given an integer array nums, move all 0\'s to the end while maintaining the relative order of the non-zero elements.',
    constraints: '1 <= nums.length <= 10^4\n-2^31 <= nums[i] <= 2^31 - 1',
    sampleInput: 'nums = [0,1,0,3,12]', sampleOutput: '[1,3,12,0,0]',
    explanation: 'Move all zeros to the end while maintaining order of non-zero elements.',
    hints: ['Use two pointers', 'Swap non-zero elements with position pointer'],
    difficulty: 'easy',
    testCases: [
      { input: 'nums = [0,1,0,3,12]', output: '[1,3,12,0,0]', isHidden: false },
      { input: 'nums = [0]', output: '[0]', isHidden: true },
      { input: 'nums = [1]', output: '[1]', isHidden: true },
      { input: 'nums = [0,0,1]', output: '[1,0,0]', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Meta', topic: 'Linked List', category: 'Linked List',
    title: 'Reverse Linked List',
    description: 'Given the head of a singly linked list, reverse the list and return the reversed list.',
    constraints: 'The number of nodes in the list is in range [0, 5000]\n-5000 <= Node.val <= 5000',
    sampleInput: 'head = [1,2,3,4,5]', sampleOutput: '[5,4,3,2,1]',
    explanation: 'Reverse the entire linked list.',
    hints: ['Use three pointers: prev, current, next', 'Iteratively reverse links'],
    difficulty: 'easy',
    testCases: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', isHidden: false },
      { input: 'head = [1,2]', output: '[2,1]', isHidden: true },
      { input: 'head = [1]', output: '[1]', isHidden: true },
      { input: 'head = [1,2,3]', output: '[3,2,1]', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Apple', topic: 'Binary Search', category: 'Binary Search',
    title: 'Binary Search',
    description: 'Given a sorted array of integers nums and a target value, return the index of target if found, otherwise return -1.',
    constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique\nnums is sorted in ascending order',
    sampleInput: 'nums = [-1,0,3,5,9,12], target = 9', sampleOutput: '4',
    explanation: '9 exists in nums and its index is 4.',
    hints: ['Use binary search algorithm', 'Compare middle element with target'],
    difficulty: 'easy',
    testCases: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', isHidden: false },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', isHidden: true },
      { input: 'nums = [5], target = 5', output: '0', isHidden: true },
      { input: 'nums = [1,2,3,4,5], target = 1', output: '0', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Google', topic: 'Hash Map', category: 'Hash Map',
    title: 'Contains Duplicate',
    description: 'Given an integer array nums, return true if any value appears at least twice, and return false if every element is distinct.',
    constraints: '1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
    sampleInput: 'nums = [1,2,3,1]', sampleOutput: 'true',
    explanation: 'The element 1 appears twice.',
    hints: ['Use a HashSet to track seen numbers', 'Return true when duplicate found'],
    difficulty: 'easy',
    testCases: [
      { input: 'nums = [1,2,3,1]', output: 'true', isHidden: false },
      { input: 'nums = [1,2,3,4]', output: 'false', isHidden: true },
      { input: 'nums = [1]', output: 'false', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Amazon', topic: 'Arrays', category: 'Arrays',
    title: 'Majority Element',
    description: 'Given an array nums of size n, return the majority element. The majority element is the element that appears more than n/2 times.',
    constraints: 'n == nums.length\n1 <= n <= 5 * 10^4\n-10^9 <= nums[i] <= 10^9',
    sampleInput: 'nums = [3,2,3]', sampleOutput: '3',
    explanation: '3 appears twice which is more than n/2.',
    hints: ['Use Boyer-Moore voting algorithm', 'Or use HashMap to count frequencies'],
    difficulty: 'easy',
    testCases: [
      { input: 'nums = [3,2,3]', output: '3', isHidden: false },
      { input: 'nums = [2,2,1,1,1,2,2]', output: '2', isHidden: true },
      { input: 'nums = [1]', output: '1', isHidden: true },
      { input: 'nums = [6,5,5]', output: '5', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Microsoft', topic: 'Strings', category: 'Strings',
    title: 'First Unique Character',
    description: 'Given a string s, find the first non-repeating character in it and return its index. If it does not exist, return -1.',
    constraints: '1 <= s.length <= 10^5\ns consists of only lowercase English letters',
    sampleInput: 's = "leetcode"', sampleOutput: '0',
    explanation: "The first non-repeating character is 'l' at index 0.",
    hints: ['Use HashMap to count character frequencies', 'Iterate again to find first character with count 1'],
    difficulty: 'easy',
    testCases: [
      { input: 's = "leetcode"', output: '0', isHidden: false },
      { input: 's = "loveleetcode"', output: '2', isHidden: true },
      { input: 's = "aabb"', output: '-1', isHidden: true },
      { input: 's = "aadadaad"', output: '-1', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Meta', topic: 'Arrays', category: 'Arrays',
    title: 'Best Time to Buy and Sell Stock',
    description: 'Given an array prices where prices[i] is the price on the ith day, maximize profit by choosing a single day to buy and another day to sell.',
    constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4',
    sampleInput: 'prices = [7,1,5,3,6,4]', sampleOutput: '5',
    explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.',
    hints: ['Track minimum price seen so far', 'Calculate profit at each step'],
    difficulty: 'easy',
    testCases: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', isHidden: false },
      { input: 'prices = [7,6,4,3,1]', output: '0', isHidden: true },
      { input: 'prices = [1,2]', output: '1', isHidden: true },
      { input: 'prices = [3,2,6,5,0,3]', output: '4', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Apple', topic: 'Binary Tree', category: 'Binary Tree',
    title: 'Maximum Depth of Binary Tree',
    description: 'Given the root of a binary tree, return its maximum depth.',
    constraints: 'The number of nodes in the tree is in range [0, 10^4]\n-100 <= Node.val <= 100',
    sampleInput: 'root = [3,9,20,null,null,15,7]', sampleOutput: '3',
    explanation: 'The longest path is 3->20->15 or 3->20->7.',
    hints: ['Use recursion', 'Return 1 + max(left depth, right depth)'],
    difficulty: 'easy',
    testCases: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '3', isHidden: false },
      { input: 'root = [1,null,2]', output: '2', isHidden: true },
      { input: 'root = []', output: '0', isHidden: true },
      { input: 'root = [0]', output: '1', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Google', topic: 'Linked List', category: 'Linked List',
    title: 'Merge Two Sorted Lists',
    description: 'Merge two sorted linked lists and return it as a sorted list.',
    constraints: 'The number of nodes in both lists is in range [0, 50]\n-100 <= Node.val <= 100',
    sampleInput: 'list1 = [1,2,4], list2 = [1,3,4]', sampleOutput: '[1,1,2,3,4,4]',
    explanation: 'Merge both sorted lists into one sorted list.',
    hints: ['Use dummy node and two pointers', 'Compare values and attach smaller node'],
    difficulty: 'easy',
    testCases: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]', isHidden: false },
      { input: 'list1 = [], list2 = []', output: '[]', isHidden: true },
      { input: 'list1 = [], list2 = [0]', output: '[0]', isHidden: true },
      { input: 'list1 = [5], list2 = [1,2,4]', output: '[1,2,4,5]', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Amazon', topic: 'Stack', category: 'Stack',
    title: 'Valid Parentheses',
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'",
    sampleInput: 's = "()[]{}"', sampleOutput: 'true',
    explanation: 'All brackets are properly closed.',
    hints: ['Use a stack to track opening brackets', 'Match closing brackets with top of stack'],
    difficulty: 'easy',
    testCases: [
      { input: 's = "()[]{}"', output: 'true', isHidden: false },
      { input: 's = "(]"', output: 'false', isHidden: true },
      { input: 's = "{[]}"', output: 'true', isHidden: true },
      { input: 's = "(("', output: 'false', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Microsoft', topic: 'Arrays', category: 'Arrays',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists',
    sampleInput: 'nums = [2,7,11,15], target = 9', sampleOutput: '[0,1]',
    explanation: 'nums[0] + nums[1] = 2 + 7 = 9.',
    hints: ['Use HashMap to store complements', 'Check if target - current exists in map'],
    difficulty: 'easy',
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', isHidden: false },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', isHidden: true },
      { input: 'nums = [3,3], target = 6', output: '[0,1]', isHidden: true },
      { input: 'nums = [0,4,3,0], target = 0', output: '[0,3]', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Meta', topic: 'Binary Tree', category: 'Binary Tree',
    title: 'Symmetric Tree',
    description: 'Given the root of a binary tree, check whether it is a mirror of itself.',
    constraints: 'The number of nodes in the tree is in range [1, 1000]\n-100 <= Node.val <= 100',
    sampleInput: 'root = [1,2,2,3,4,4,3]', sampleOutput: 'true',
    explanation: 'The tree is symmetric around its center.',
    hints: ['Use recursion to compare left and right subtrees', 'Check if left.left mirrors right.right'],
    difficulty: 'easy',
    testCases: [
      { input: 'root = [1,2,2,3,4,4,3]', output: 'true', isHidden: false },
      { input: 'root = [1,2,2,null,3,null,3]', output: 'false', isHidden: true },
      { input: 'root = [1]', output: 'true', isHidden: true },
      { input: 'root = [1,2,3]', output: 'false', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Apple', topic: 'Strings', category: 'Strings',
    title: 'Valid Anagram',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    constraints: '1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters',
    sampleInput: 's = "anagram", t = "nagaram"', sampleOutput: 'true',
    explanation: 'Both strings have the same characters with same frequencies.',
    hints: ['Sort both strings and compare', 'Or use HashMap to count character frequencies'],
    difficulty: 'easy',
    testCases: [
      { input: 's = "anagram", t = "nagaram"', output: 'true', isHidden: false },
      { input: 's = "rat", t = "car"', output: 'false', isHidden: true },
      { input: 's = "ab", t = "ba"', output: 'true', isHidden: true },
      { input: 's = "abc", t = "ab"', output: 'false', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Google', topic: 'Arrays', category: 'Arrays',
    title: 'Intersection of Two Arrays II',
    description: 'Given two integer arrays nums1 and nums2, return an array of their intersection. Each element must appear as many times as it shows in both arrays.',
    constraints: '1 <= nums1.length, nums2.length <= 1000\n0 <= nums1[i], nums2[i] <= 1000',
    sampleInput: 'nums1 = [1,2,2,1], nums2 = [2,2]', sampleOutput: '[2,2]',
    explanation: '2 appears twice in both arrays.',
    hints: ['Use HashMap to count frequencies in one array', 'Iterate other array and add to result if count > 0'],
    difficulty: 'easy',
    testCases: [
      { input: 'nums1 = [1,2,2,1], nums2 = [2,2]', output: '[2,2]', isHidden: false },
      { input: 'nums1 = [4,9,5], nums2 = [9,4,9,8,4]', output: '[4,9]', isHidden: true },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '[]', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Amazon', topic: 'Math', category: 'Math',
    title: 'Climbing Stairs',
    description: 'You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    constraints: '1 <= n <= 45',
    sampleInput: 'n = 3', sampleOutput: '3',
    explanation: 'Three ways: 1+1+1, 1+2, 2+1.',
    hints: ['This is Fibonacci sequence', 'dp[i] = dp[i-1] + dp[i-2]'],
    difficulty: 'easy',
    testCases: [
      { input: 'n = 3', output: '3', isHidden: false },
      { input: 'n = 2', output: '2', isHidden: true },
      { input: 'n = 10', output: '89', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Microsoft', topic: 'Linked List', category: 'Linked List',
    title: 'Linked List Cycle',
    description: 'Given head of a linked list, determine if the linked list has a cycle in it.',
    constraints: 'The number of nodes in the list is in range [0, 10^4]\n-10^5 <= Node.val <= 10^5',
    sampleInput: 'head = [3,2,0,-4], pos = 1', sampleOutput: 'true',
    explanation: 'There is a cycle where the tail connects to the 1st node.',
    hints: ["Use Floyd's cycle detection (slow and fast pointers)", 'If fast meets slow, cycle exists'],
    difficulty: 'easy',
    testCases: [
      { input: 'head = [3,2,0,-4], pos = 1', output: 'true', isHidden: false },
      { input: 'head = [1,2], pos = 0', output: 'true', isHidden: true },
      { input: 'head = [1], pos = -1', output: 'false', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Meta', topic: 'Arrays', category: 'Arrays',
    title: 'Plus One',
    description: 'Given a non-empty array of decimal digits representing a non-negative integer, increment it by one.',
    constraints: '1 <= digits.length <= 100\n0 <= digits[i] <= 9',
    sampleInput: 'digits = [1,2,3]', sampleOutput: '[1,2,4]',
    explanation: 'The array represents 123, incrementing by 1 gives 124.',
    hints: ['Handle carry from right to left', 'If all 9s, need to add extra digit at front'],
    difficulty: 'easy',
    testCases: [
      { input: 'digits = [1,2,3]', output: '[1,2,4]', isHidden: false },
      { input: 'digits = [9]', output: '[1,0]', isHidden: true },
      { input: 'digits = [9,9,9]', output: '[1,0,0,0]', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Apple', topic: 'Binary Tree', category: 'Binary Tree',
    title: 'Invert Binary Tree',
    description: 'Given the root of a binary tree, invert the tree and return its root.',
    constraints: 'The number of nodes in the tree is in range [0, 100]\n-100 <= Node.val <= 100',
    sampleInput: 'root = [4,2,7,1,3,6,9]', sampleOutput: '[4,7,2,9,6,3,1]',
    explanation: 'All left and right children are swapped.',
    hints: ['Use recursion', 'Swap left and right, then recursively invert both subtrees'],
    difficulty: 'easy',
    testCases: [
      { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]', isHidden: false },
      { input: 'root = [2,1,3]', output: '[2,3,1]', isHidden: true },
      { input: 'root = []', output: '[]', isHidden: true },
    ],
    isPremium: false,
  },
  {
    company: 'Google', topic: 'Arrays', category: 'Arrays',
    title: 'Remove Duplicates from Sorted Array',
    description: 'Given an integer array nums sorted in non-decreasing order, remove duplicates in-place such that each unique element appears only once.',
    constraints: '1 <= nums.length <= 3 * 10^4\n-100 <= nums[i] <= 100',
    sampleInput: 'nums = [1,1,2]', sampleOutput: '2',
    explanation: 'First two elements contain unique values.',
    hints: ['Use two pointers', 'Move unique elements to front'],
    difficulty: 'easy',
    testCases: [
      { input: 'nums = [1,1,2]', output: '2', isHidden: false },
      { input: 'nums = [0,0,1,1,1,2,2,3,3,4]', output: '5', isHidden: true },
      { input: 'nums = [1,1,1,1]', output: '1', isHidden: true },
    ],
    isPremium: false,
  },
];

// ── Main ───────────────────────────────────────────────────────────────────────
async function run() {
  try {
    await connectDB();
    console.log('Connected to database.\n');

    // Step 1: Find all missing sourceIds in the target range
    const presentIds = new Set(
      (await CodingQuestion.find({ sourceId: { $gte: SOURCE_ID_MIN, $lte: SOURCE_ID_MAX } })
        .select('sourceId')
        .lean())
        .map((q) => q.sourceId),
    );

    const gapIds = [];
    for (let id = SOURCE_ID_MIN; id <= SOURCE_ID_MAX; id++) {
      if (!presentIds.has(id)) gapIds.push(id);
    }

    if (gapIds.length === 0) {
      console.log(`✅ No gaps found in ${SOURCE_ID_MIN}–${SOURCE_ID_MAX}. Nothing to import.`);
      process.exit(0);
    }

    console.log(`Found ${gapIds.length} gap(s): ${gapIds.join(', ')}\n`);

    // Step 2: Map questions to gap IDs (first N questions fill first N gaps)
    const toImport = Math.min(gapIds.length, rawQuestions.length);
    console.log(`Importing ${toImport} question(s) to fill gap(s)...\n`);

    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < toImport; i++) {
      const gapId = gapIds[i];
      const question = rawQuestions[i];

      // Double-check: skip if somehow this ID already exists (race-condition guard)
      const alreadyExists = await CodingQuestion.findOne({ sourceId: gapId }).select('_id title').lean();
      if (alreadyExists) {
        console.log(`  ⚠️  sourceId ${gapId} already exists ("${alreadyExists.title}") — skipping.`);
        skipped++;
        continue;
      }

      const doc = buildDocument(question, gapId);
      await CodingQuestion.create(doc);
      console.log(`  ✅ Inserted sourceId ${gapId}: "${doc.title}" (${doc.testCases.length} test cases, ${doc.testCases.filter((tc) => tc.isHidden).length} hidden)`);
      inserted++;
    }

    if (rawQuestions.length < gapIds.length) {
      const remaining = gapIds.slice(rawQuestions.length);
      console.log(`\n  ⚠️  ${remaining.length} gap(s) could not be filled (no source data): ${remaining.join(', ')}`);
      console.log('     Add more questions to the rawQuestions pool in this script to fill them.');
    }

    // Step 3: Final integrity report
    const finalCount = await CodingQuestion.countDocuments({
      sourceId: { $gte: SOURCE_ID_MIN, $lte: SOURCE_ID_MAX },
    });

    const finalPresentIds = new Set(
      (await CodingQuestion.find({ sourceId: { $gte: SOURCE_ID_MIN, $lte: SOURCE_ID_MAX } })
        .select('sourceId')
        .lean())
        .map((q) => q.sourceId),
    );

    const remainingGaps = [];
    for (let id = SOURCE_ID_MIN; id <= SOURCE_ID_MAX; id++) {
      if (!finalPresentIds.has(id)) remainingGaps.push(id);
    }

    console.log(`\n=== Final Integrity Report (${SOURCE_ID_MIN}–${SOURCE_ID_MAX}) ===`);
    console.log(`  Inserted this run : ${inserted}`);
    console.log(`  Skipped (exists)  : ${skipped}`);
    console.log(`  Questions present : ${finalCount} / ${SOURCE_ID_MAX - SOURCE_ID_MIN + 1}`);
    if (remainingGaps.length === 0) {
      console.log(`  ✅ Full sequential coverage: ${SOURCE_ID_MIN}–${SOURCE_ID_MAX}`);
    } else {
      console.log(`  ⚠️  Still missing ${remainingGaps.length} IDs: ${remainingGaps.join(', ')}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Fill gaps failed:', error.message);
    process.exit(1);
  }
}

run();
