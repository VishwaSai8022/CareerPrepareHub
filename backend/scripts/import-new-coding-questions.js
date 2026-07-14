import connectDB from '../src/config/db.js';
import CodingQuestion from '../src/models/codingQuestion.model.js';

const rawQuestions = [
  {
    "sourceId": 448,
    "company": "Google",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Find Peak Element",
    "description": "A peak element is an element that is strictly greater than its neighbors. Given an array nums, find a peak element and return its index.",
    "constraints": "1 <= nums.length <= 1000\n-2^31 <= nums[i] <= 2^31 - 1\nnums[i] != nums[i + 1] for all valid i",
    "sampleInput": "nums = [1,2,3,1]",
    "sampleOutput": "2",
    "explanation": "3 is a peak element and your function should return the index number 2.",
    "hints": ["Use binary search", "Compare middle element with its neighbors"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [1,2,3,1]", "output": "2", "isHidden": false },
      { "input": "nums = [1,2,1,3,5,6,4]", "output": "5", "isHidden": true },
      { "input": "nums = [1]", "output": "0", "isHidden": true },
      { "input": "nums = [1,2]", "output": "1", "isHidden": true },
      { "input": "nums = [2,1]", "output": "0", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 449,
    "company": "Amazon",
    "topic": "Strings",
    "category": "Strings",
    "title": "Valid Palindrome",
    "description": "Given a string s, return true if it is a palindrome, considering only alphanumeric characters and ignoring cases.",
    "constraints": "1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters",
    "sampleInput": "s = \"A man, a plan, a canal: Panama\"",
    "sampleOutput": "true",
    "explanation": "After removing non-alphanumeric and converting to lowercase: \"amanaplanacanalpanama\" is a palindrome.",
    "hints": ["Use two pointers from both ends", "Skip non-alphanumeric characters"],
    "difficulty": "easy",
    "testCases": [
      { "input": "s = \"A man, a plan, a canal: Panama\"", "output": "true", "isHidden": false },
      { "input": "s = \"race a car\"", "output": "false", "isHidden": true },
      { "input": "s = \" \"", "output": "true", "isHidden": true },
      { "input": "s = \"ab_a\"", "output": "true", "isHidden": true },
      { "input": "s = \"0P\"", "output": "false", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 450,
    "company": "Microsoft",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Move Zeroes",
    "description": "Given an integer array nums, move all 0's to the end while maintaining the relative order of the non-zero elements.",
    "constraints": "1 <= nums.length <= 10^4\n-2^31 <= nums[i] <= 2^31 - 1",
    "sampleInput": "nums = [0,1,0,3,12]",
    "sampleOutput": "[1,3,12,0,0]",
    "explanation": "Move all zeros to the end while maintaining order of non-zero elements.",
    "hints": ["Use two pointers", "Swap non-zero elements with position pointer"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [0,1,0,3,12]", "output": "[1,3,12,0,0]", "isHidden": false },
      { "input": "nums = [0]", "output": "[0]", "isHidden": true },
      { "input": "nums = [1]", "output": "[1]", "isHidden": true },
      { "input": "nums = [1,0]", "output": "[1,0]", "isHidden": true },
      { "input": "nums = [0,0,1]", "output": "[1,0,0]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 451,
    "company": "Meta",
    "topic": "LinkedList",
    "category": "LinkedList",
    "title": "Reverse Linked List",
    "description": "Given the head of a singly linked list, reverse the list and return the reversed list.",
    "constraints": "The number of nodes in the list is in range [0, 5000]\n-5000 <= Node.val <= 5000",
    "sampleInput": "head = [1,2,3,4,5]",
    "sampleOutput": "[5,4,3,2,1]",
    "explanation": "Reverse the entire linked list.",
    "hints": ["Use three pointers: prev, current, next", "Iteratively reverse links"],
    "difficulty": "easy",
    "testCases": [
      { "input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]", "isHidden": false },
      { "input": "head = [1,2]", "output": "[2,1]", "isHidden": true },
      { "input": "head = []", "output": "[]", "isHidden": true },
      { "input": "head = [1]", "output": "[1]", "isHidden": true },
      { "input": "head = [1,2,3]", "output": "[3,2,1]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 452,
    "company": "Apple",
    "topic": "Binary Search",
    "category": "Binary Search",
    "title": "Binary Search",
    "description": "Given a sorted array of integers nums and a target value, return the index of target if found, otherwise return -1.",
    "constraints": "1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique\nnums is sorted in ascending order",
    "sampleInput": "nums = [-1,0,3,5,9,12], target = 9",
    "sampleOutput": "4",
    "explanation": "9 exists in nums and its index is 4.",
    "hints": ["Use binary search algorithm", "Compare middle element with target"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [-1,0,3,5,9,12], target = 9", "output": "4", "isHidden": false },
      { "input": "nums = [-1,0,3,5,9,12], target = 2", "output": "-1", "isHidden": true },
      { "input": "nums = [5], target = 5", "output": "0", "isHidden": true },
      { "input": "nums = [1,2,3,4,5], target = 1", "output": "0", "isHidden": true },
      { "input": "nums = [1,2,3,4,5], target = 5", "output": "4", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 453,
    "company": "Google",
    "topic": "HashMap",
    "category": "HashMap",
    "title": "Contains Duplicate",
    "description": "Given an integer array nums, return true if any value appears at least twice, and return false if every element is distinct.",
    "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
    "sampleInput": "nums = [1,2,3,1]",
    "sampleOutput": "true",
    "explanation": "The element 1 appears twice.",
    "hints": ["Use a HashSet to track seen numbers", "Return true when duplicate found"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [1,2,3,1]", "output": "true", "isHidden": false },
      { "input": "nums = [1,2,3,4]", "output": "false", "isHidden": true },
      { "input": "nums = [1,1,1,3,3,4,3,2,4,2]", "output": "true", "isHidden": true },
      { "input": "nums = [1]", "output": "false", "isHidden": true },
      { "input": "nums = [1,2]", "output": "false", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 454,
    "company": "Amazon",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Majority Element",
    "description": "Given an array nums of size n, return the majority element. The majority element is the element that appears more than n/2 times.",
    "constraints": "n == nums.length\n1 <= n <= 5 * 10^4\n-10^9 <= nums[i] <= 10^9",
    "sampleInput": "nums = [3,2,3]",
    "sampleOutput": "3",
    "explanation": "3 appears twice which is more than n/2.",
    "hints": ["Use Boyer-Moore voting algorithm", "Or use HashMap to count frequencies"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [3,2,3]", "output": "3", "isHidden": false },
      { "input": "nums = [2,2,1,1,1,2,2]", "output": "2", "isHidden": true },
      { "input": "nums = [1]", "output": "1", "isHidden": true },
      { "input": "nums = [1,1,2]", "output": "1", "isHidden": true },
      { "input": "nums = [6,5,5]", "output": "5", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 455,
    "company": "Microsoft",
    "topic": "Strings",
    "category": "Strings",
    "title": "First Unique Character",
    "description": "Given a string s, find the first non-repeating character in it and return its index. If it does not exist, return -1.",
    "constraints": "1 <= s.length <= 10^5\ns consists of only lowercase English letters",
    "sampleInput": "s = \"leetcode\"",
    "sampleOutput": "0",
    "explanation": "The first non-repeating character is 'l' at index 0.",
    "hints": ["Use HashMap to count character frequencies", "Iterate again to find first character with count 1"],
    "difficulty": "easy",
    "testCases": [
      { "input": "s = \"leetcode\"", "output": "0", "isHidden": false },
      { "input": "s = \"loveleetcode\"", "output": "2", "isHidden": true },
      { "input": "s = \"aabb\"", "output": "-1", "isHidden": true },
      { "input": "s = \"z\"", "output": "0", "isHidden": true },
      { "input": "s = \"aadadaad\"", "output": "-1", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 456,
    "company": "Meta",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Best Time to Buy and Sell Stock",
    "description": "Given an array prices where prices[i] is the price on the ith day, maximize profit by choosing a single day to buy and another day to sell.",
    "constraints": "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
    "sampleInput": "prices = [7,1,5,3,6,4]",
    "sampleOutput": "5",
    "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
    "hints": ["Track minimum price seen so far", "Calculate profit at each step"],
    "difficulty": "easy",
    "testCases": [
      { "input": "prices = [7,1,5,3,6,4]", "output": "5", "isHidden": false },
      { "input": "prices = [7,6,4,3,1]", "output": "0", "isHidden": true },
      { "input": "prices = [1,2]", "output": "1", "isHidden": true },
      { "input": "prices = [2,4,1]", "output": "2", "isHidden": true },
      { "input": "prices = [3,2,6,5,0,3]", "output": "4", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 457,
    "company": "Apple",
    "topic": "Binary Tree",
    "category": "Binary Tree",
    "title": "Maximum Depth of Binary Tree",
    "description": "Given the root of a binary tree, return its maximum depth. Maximum depth is the number of nodes along the longest path from root to leaf.",
    "constraints": "The number of nodes in the tree is in range [0, 10^4]\n-100 <= Node.val <= 100",
    "sampleInput": "root = [3,9,20,null,null,15,7]",
    "sampleOutput": "3",
    "explanation": "The longest path is 3->20->15 or 3->20->7.",
    "hints": ["Use recursion", "Return 1 + max(left depth, right depth)"],
    "difficulty": "easy",
    "testCases": [
      { "input": "root = [3,9,20,null,null,15,7]", "output": "3", "isHidden": false },
      { "input": "root = [1,null,2]", "output": "2", "isHidden": true },
      { "input": "root = []", "output": "0", "isHidden": true },
      { "input": "root = [0]", "output": "1", "isHidden": true },
      { "input": "root = [1,2,3,4,5]", "output": "3", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 458,
    "company": "Google",
    "topic": "LinkedList",
    "category": "LinkedList",
    "title": "Merge Two Sorted Lists",
    "description": "Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.",
    "constraints": "The number of nodes in both lists is in range [0, 50]\n-100 <= Node.val <= 100\nBoth list1 and list2 are sorted in non-decreasing order",
    "sampleInput": "list1 = [1,2,4], list2 = [1,3,4]",
    "sampleOutput": "[1,1,2,3,4,4]",
    "explanation": "Merge both sorted lists into one sorted list.",
    "hints": ["Use dummy node and two pointers", "Compare values and attach smaller node"],
    "difficulty": "easy",
    "testCases": [
      { "input": "list1 = [1,2,4], list2 = [1,3,4]", "output": "[1,1,2,3,4,4]", "isHidden": false },
      { "input": "list1 = [], list2 = []", "output": "[]", "isHidden": true },
      { "input": "list1 = [], list2 = [0]", "output": "[0]", "isHidden": true },
      { "input": "list1 = [1], list2 = [2]", "output": "[1,2]", "isHidden": true },
      { "input": "list1 = [5], list2 = [1,2,4]", "output": "[1,2,4,5]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 459,
    "company": "Amazon",
    "topic": "Stack",
    "category": "Stack",
    "title": "Valid Parentheses",
    "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    "constraints": "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'",
    "sampleInput": "s = \"()[]{}\"",
    "sampleOutput": "true",
    "explanation": "All brackets are properly closed.",
    "hints": ["Use a stack to track opening brackets", "Match closing brackets with top of stack"],
    "difficulty": "easy",
    "testCases": [
      { "input": "s = \"()[]{}\"", "output": "true", "isHidden": false },
      { "input": "s = \"(]\"", "output": "false", "isHidden": true },
      { "input": "s = \"([)]\"", "output": "false", "isHidden": true },
      { "input": "s = \"{[]}\"", "output": "true", "isHidden": true },
      { "input": "s = \"((\"", "output": "false", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 460,
    "company": "Microsoft",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Two Sum",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists",
    "sampleInput": "nums = [2,7,11,15], target = 9",
    "sampleOutput": "[0,1]",
    "explanation": "nums[0] + nums[1] = 2 + 7 = 9.",
    "hints": ["Use HashMap to store complements", "Check if target - current exists in map"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "isHidden": false },
      { "input": "nums = [3,2,4], target = 6", "output": "[1,2]", "isHidden": true },
      { "input": "nums = [3,3], target = 6", "output": "[0,1]", "isHidden": true },
      { "input": "nums = [-1,-2,-3,-4,-5], target = -8", "output": "[2,4]", "isHidden": true },
      { "input": "nums = [0,4,3,0], target = 0", "output": "[0,3]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 461,
    "company": "Meta",
    "topic": "Binary Tree",
    "category": "Binary Tree",
    "title": "Symmetric Tree",
    "description": "Given the root of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center).",
    "constraints": "The number of nodes in the tree is in range [1, 1000]\n-100 <= Node.val <= 100",
    "sampleInput": "root = [1,2,2,3,4,4,3]",
    "sampleOutput": "true",
    "explanation": "The tree is symmetric around its center.",
    "hints": ["Use recursion to compare left and right subtrees", "Check if left.left mirrors right.right"],
    "difficulty": "easy",
    "testCases": [
      { "input": "root = [1,2,2,3,4,4,3]", "output": "true", "isHidden": false },
      { "input": "root = [1,2,2,null,3,null,3]", "output": "false", "isHidden": true },
      { "input": "root = [1]", "output": "true", "isHidden": true },
      { "input": "root = [1,2,2]", "output": "true", "isHidden": true },
      { "input": "root = [1,2,3]", "output": "false", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 462,
    "company": "Apple",
    "topic": "Strings",
    "category": "Strings",
    "title": "Valid Anagram",
    "description": "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    "constraints": "1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters",
    "sampleInput": "s = \"anagram\", t = \"nagaram\"",
    "sampleOutput": "true",
    "explanation": "Both strings have the same characters with same frequencies.",
    "hints": ["Sort both strings and compare", "Or use HashMap to count character frequencies"],
    "difficulty": "easy",
    "testCases": [
      { "input": "s = \"anagram\", t = \"nagaram\"", "output": "true", "isHidden": false },
      { "input": "s = \"rat\", t = \"car\"", "output": "false", "isHidden": true },
      { "input": "s = \"a\", t = \"a\"", "output": "true", "isHidden": true },
      { "input": "s = \"ab\", t = \"ba\"", "output": "true", "isHidden": true },
      { "input": "s = \"abc\", t = \"ab\"", "output": "false", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 463,
    "company": "Google",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Intersection of Two Arrays II",
    "description": "Given two integer arrays nums1 and nums2, return an array of their intersection. Each element must appear as many times as it shows in both arrays.",
    "constraints": "1 <= nums1.length, nums2.length <= 1000\n0 <= nums1[i], nums2[i] <= 1000",
    "sampleInput": "nums1 = [1,2,2,1], nums2 = [2,2]",
    "sampleOutput": "[2,2]",
    "explanation": "2 appears twice in both arrays.",
    "hints": ["Use HashMap to count frequencies in one array", "Iterate other array and add to result if count > 0"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums1 = [1,2,2,1], nums2 = [2,2]", "output": "[2,2]", "isHidden": false },
      { "input": "nums1 = [4,9,5], nums2 = [9,4,9,8,4]", "output": "[4,9]", "isHidden": true },
      { "input": "nums1 = [1], nums2 = [1]", "output": "[1]", "isHidden": true },
      { "input": "nums1 = [1,2], nums2 = [3,4]", "output": "[]", "isHidden": true },
      { "input": "nums1 = [1,1,1], nums2 = [1,1]", "output": "[1,1]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 464,
    "company": "Amazon",
    "topic": "Math",
    "category": "Math",
    "title": "Climbing Stairs",
    "description": "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    "constraints": "1 <= n <= 45",
    "sampleInput": "n = 3",
    "sampleOutput": "3",
    "explanation": "Three ways: 1+1+1, 1+2, 2+1.",
    "hints": ["This is Fibonacci sequence", "dp[i] = dp[i-1] + dp[i-2]"],
    "difficulty": "easy",
    "testCases": [
      { "input": "n = 3", "output": "3", "isHidden": false },
      { "input": "n = 2", "output": "2", "isHidden": true },
      { "input": "n = 1", "output": "1", "isHidden": true },
      { "input": "n = 5", "output": "8", "isHidden": true },
      { "input": "n = 10", "output": "89", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 465,
    "company": "Microsoft",
    "topic": "LinkedList",
    "category": "LinkedList",
    "title": "Linked List Cycle",
    "description": "Given head of a linked list, determine if the linked list has a cycle in it.",
    "constraints": "The number of nodes in the list is in range [0, 10^4]\n-10^5 <= Node.val <= 10^5\npos is -1 or a valid index in the linked-list",
    "sampleInput": "head = [3,2,0,-4], pos = 1",
    "sampleOutput": "true",
    "explanation": "There is a cycle where the tail connects to the 1st node (0-indexed).",
    "hints": ["Use Floyd's cycle detection (slow and fast pointers)", "If fast meets slow, cycle exists"],
    "difficulty": "easy",
    "testCases": [
      { "input": "head = [3,2,0,-4], pos = 1", "output": "true", "isHidden": false },
      { "input": "head = [1,2], pos = 0", "output": "true", "isHidden": true },
      { "input": "head = [1], pos = -1", "output": "false", "isHidden": true },
      { "input": "head = [], pos = -1", "output": "false", "isHidden": true },
      { "input": "head = [1,2,3], pos = -1", "output": "false", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 466,
    "company": "Meta",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Plus One",
    "description": "Given a non-empty array of decimal digits representing a non-negative integer, increment it by one and return the resulting array.",
    "constraints": "1 <= digits.length <= 100\n0 <= digits[i] <= 9\ndigits does not contain leading zeros except 0 itself",
    "sampleInput": "digits = [1,2,3]",
    "sampleOutput": "[1,2,4]",
    "explanation": "The array represents 123, incrementing by 1 gives 124.",
    "hints": ["Handle carry from right to left", "If all 9s, need to add extra digit at front"],
    "difficulty": "easy",
    "testCases": [
      { "input": "digits = [1,2,3]", "output": "[1,2,4]", "isHidden": false },
      { "input": "digits = [4,3,2,1]", "output": "[4,3,2,2]", "isHidden": true },
      { "input": "digits = [9]", "output": "[1,0]", "isHidden": true },
      { "input": "digits = [9,9,9]", "output": "[1,0,0,0]", "isHidden": true },
      { "input": "digits = [0]", "output": "[1]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 467,
    "company": "Apple",
    "topic": "Binary Tree",
    "category": "Binary Tree",
    "title": "Invert Binary Tree",
    "description": "Given the root of a binary tree, invert the tree and return its root (swap left and right children at every node).",
    "constraints": "The number of nodes in the tree is in range [0, 100]\n-100 <= Node.val <= 100",
    "sampleInput": "root = [4,2,7,1,3,6,9]",
    "sampleOutput": "[4,7,2,9,6,3,1]",
    "explanation": "All left and right children are swapped.",
    "hints": ["Use recursion", "Swap left and right, then recursively invert both subtrees"],
    "difficulty": "easy",
    "testCases": [
      { "input": "root = [4,2,7,1,3,6,9]", "output": "[4,7,2,9,6,3,1]", "isHidden": false },
      { "input": "root = [2,1,3]", "output": "[2,3,1]", "isHidden": true },
      { "input": "root = []", "output": "[]", "isHidden": true },
      { "input": "root = [1]", "output": "[1]", "isHidden": true },
      { "input": "root = [1,2]", "output": "[1,null,2]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 468,
    "company": "Google",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Remove Duplicates from Sorted Array",
    "description": "Given an integer array nums sorted in non-decreasing order, remove duplicates in-place such that each unique element appears only once.",
    "constraints": "1 <= nums.length <= 3 * 10^4\n-100 <= nums[i] <= 100\nnums is sorted in non-decreasing order",
    "sampleInput": "nums = [1,1,2]",
    "sampleOutput": "2, nums = [1,2,_]",
    "explanation": "First two elements contain unique values.",
    "hints": ["Use two pointers", "Move unique elements to front"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [1,1,2]", "output": "2", "isHidden": false },
      { "input": "nums = [0,0,1,1,1,2,2,3,3,4]", "output": "5", "isHidden": true },
      { "input": "nums = [1]", "output": "1", "isHidden": true },
      { "input": "nums = [1,2,3]", "output": "3", "isHidden": true },
      { "input": "nums = [1,1,1,1]", "output": "1", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 469,
    "company": "Amazon",
    "topic": "Strings",
    "category": "Strings",
    "title": "Implement strStr()",
    "description": "Given two strings needle and haystack, return the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack.",
    "constraints": "1 <= haystack.length, needle.length <= 10^4\nhaystack and needle consist of only lowercase English characters",
    "sampleInput": "haystack = \"hello\", needle = \"ll\"",
    "sampleOutput": "2",
    "explanation": "\"ll\" occurs at index 2.",
    "hints": ["Use sliding window approach", "Or use built-in string search methods"],
    "difficulty": "easy",
    "testCases": [
      { "input": "haystack = \"hello\", needle = \"ll\"", "output": "2", "isHidden": false },
      { "input": "haystack = \"aaaaa\", needle = \"bba\"", "output": "-1", "isHidden": true },
      { "input": "haystack = \"a\", needle = \"a\"", "output": "0", "isHidden": true },
      { "input": "haystack = \"abc\", needle = \"c\"", "output": "2", "isHidden": true },
      { "input": "haystack = \"mississippi\", needle = \"issip\"", "output": "4", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 470,
    "company": "Microsoft",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Search Insert Position",
    "description": "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be inserted.",
    "constraints": "1 <= nums.length <= 10^4\n-10^4 <= nums[i] <= 10^4\nnums contains distinct values sorted in ascending order\n-10^4 <= target <= 10^4",
    "sampleInput": "nums = [1,3,5,6], target = 5",
    "sampleOutput": "2",
    "explanation": "5 is found at index 2.",
    "hints": ["Use binary search", "Return left pointer when target not found"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [1,3,5,6], target = 5", "output": "2", "isHidden": false },
      { "input": "nums = [1,3,5,6], target = 2", "output": "1", "isHidden": true },
      { "input": "nums = [1,3,5,6], target = 7", "output": "4", "isHidden": true },
      { "input": "nums = [1], target = 1", "output": "0", "isHidden": true },
      { "input": "nums = [1,3], target = 2", "output": "1", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 471,
    "company": "Meta",
    "topic": "Math",
    "category": "Math",
    "title": "Reverse Integer",
    "description": "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes overflow, return 0.",
    "constraints": "-2^31 <= x <= 2^31 - 1",
    "sampleInput": "x = 123",
    "sampleOutput": "321",
    "explanation": "Reverse the digits of 123 to get 321.",
    "hints": ["Use modulo to extract digits", "Check for overflow before returning"],
    "difficulty": "easy",
    "testCases": [
      { "input": "x = 123", "output": "321", "isHidden": false },
      { "input": "x = -123", "output": "-321", "isHidden": true },
      { "input": "x = 120", "output": "21", "isHidden": true },
      { "input": "x = 0", "output": "0", "isHidden": true },
      { "input": "x = 1534236469", "output": "0", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 472,
    "company": "Apple",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Single Number",
    "description": "Given a non-empty array of integers nums where every element appears twice except for one, find that single one.",
    "constraints": "1 <= nums.length <= 3 * 10^4\n-3 * 10^4 <= nums[i] <= 3 * 10^4\nEach element appears twice except for one",
    "sampleInput": "nums = [2,2,1]",
    "sampleOutput": "1",
    "explanation": "1 appears only once.",
    "hints": ["Use XOR operation", "a XOR a = 0, a XOR 0 = a"],
    "difficulty": "easy",
    "testCases": [
      { "input": "nums = [2,2,1]", "output": "1", "isHidden": false },
      { "input": "nums = [4,1,2,1,2]", "output": "4", "isHidden": true },
      { "input": "nums = [1]", "output": "1", "isHidden": true },
      { "input": "nums = [1,3,1,-1,3]", "output": "-1", "isHidden": true },
      { "input": "nums = [2,2,3,3,4]", "output": "4", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 473,
    "company": "Google",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "3Sum",
    "description": "Given an integer array nums, return all triplets [nums[i], nums[j], nums[k]] such that i != j != k and nums[i] + nums[j] + nums[k] == 0.",
    "constraints": "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
    "sampleInput": "nums = [-1,0,1,2,-1,-4]",
    "sampleOutput": "[[-1,-1,2],[-1,0,1]]",
    "explanation": "The distinct triplets are [-1,0,1] and [-1,-1,2].",
    "hints": ["Sort array first", "Use two pointers for each element", "Skip duplicates"],
    "difficulty": "medium",
    "testCases": [
      { "input": "nums = [-1,0,1,2,-1,-4]", "output": "[[-1,-1,2],[-1,0,1]]", "isHidden": false },
      { "input": "nums = [0,1,1]", "output": "[]", "isHidden": true },
      { "input": "nums = [0,0,0]", "output": "[[0,0,0]]", "isHidden": true },
      { "input": "nums = [-2,0,1,1,2]", "output": "[[-2,0,2],[-2,1,1]]", "isHidden": true },
      { "input": "nums = [-1,0,1,0]", "output": "[[-1,0,1]]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 474,
    "company": "Amazon",
    "topic": "Strings",
    "category": "Strings",
    "title": "Longest Common Prefix",
    "description": "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    "constraints": "1 <= strs.length <= 200\n0 <= strs[i].length <= 200\nstrs[i] consists of only lowercase English letters",
    "sampleInput": "strs = [\"flower\",\"flow\",\"flight\"]",
    "sampleOutput": "\"fl\"",
    "explanation": "The longest common prefix is \"fl\".",
    "hints": ["Compare characters at same position across all strings", "Stop when mismatch found"],
    "difficulty": "medium",
    "testCases": [
      { "input": "strs = [\"flower\",\"flow\",\"flight\"]", "output": "\"fl\"", "isHidden": false },
      { "input": "strs = [\"dog\",\"racecar\",\"car\"]", "output": "\"\"", "isHidden": true },
      { "input": "strs = [\"ab\",\"a\"]", "output": "\"a\"", "isHidden": true },
      { "input": "strs = [\"a\"]", "output": "\"a\"", "isHidden": true },
      { "input": "strs = [\"abc\",\"abc\",\"abc\"]", "output": "\"abc\"", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 475,
    "company": "Microsoft",
    "topic": "Sliding Window",
    "category": "Sliding Window",
    "title": "Longest Substring Without Repeating Characters",
    "description": "Given a string s, find the length of the longest substring without repeating characters.",
    "constraints": "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces",
    "sampleInput": "s = \"abcabcbb\"",
    "sampleOutput": "3",
    "explanation": "The answer is \"abc\", with length 3.",
    "hints": ["Use sliding window with HashSet", "Track start and end pointers", "Remove characters when duplicate found"],
    "difficulty": "medium",
    "testCases": [
      { "input": "s = \"abcabcbb\"", "output": "3", "isHidden": false },
      { "input": "s = \"bbbbb\"", "output": "1", "isHidden": true },
      { "input": "s = \"pwwkew\"", "output": "3", "isHidden": true },
      { "input": "s = \"\"", "output": "0", "isHidden": true },
      { "input": "s = \"dvdf\"", "output": "3", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 476,
    "company": "Meta",
    "topic": "DP",
    "category": "DP",
    "title": "Coin Change",
    "description": "You are given coins of different denominations and a total amount. Return the minimum number of coins needed to make up that amount. If not possible, return -1.",
    "constraints": "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
    "sampleInput": "coins = [1,2,5], amount = 11",
    "sampleOutput": "3",
    "explanation": "11 = 5 + 5 + 1, which is 3 coins.",
    "hints": ["Use DP where dp[i] = min coins for amount i", "For each amount, try all coins"],
    "difficulty": "medium",
    "testCases": [
      { "input": "coins = [1,2,5], amount = 11", "output": "3", "isHidden": false },
      { "input": "coins = [2], amount = 3", "output": "-1", "isHidden": true },
      { "input": "coins = [1], amount = 0", "output": "0", "isHidden": true },
      { "input": "coins = [1,2,5], amount = 100", "output": "20", "isHidden": true },
      { "input": "coins = [186,419,83,408], amount = 6249", "output": "20", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 477,
    "company": "Apple",
    "topic": "Graph",
    "category": "Graph",
    "title": "Course Schedule",
    "description": "There are n courses labeled 0 to n-1. Given prerequisites array where prerequisites[i] = [ai, bi] indicates you must take bi before ai. Return true if you can finish all courses.",
    "constraints": "1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000\nprerequisites[i].length == 2\n0 <= ai, bi < numCourses\nAll pairs are unique",
    "sampleInput": "numCourses = 2, prerequisites = [[1,0]]",
    "sampleOutput": "true",
    "explanation": "Take course 0 first, then course 1.",
    "hints": ["Detect cycle in directed graph", "Use topological sort or DFS"],
    "difficulty": "medium",
    "testCases": [
      { "input": "numCourses = 2, prerequisites = [[1,0]]", "output": "true", "isHidden": false },
      { "input": "numCourses = 2, prerequisites = [[1,0],[0,1]]", "output": "false", "isHidden": true },
      { "input": "numCourses = 1, prerequisites = []", "output": "true", "isHidden": true },
      { "input": "numCourses = 3, prerequisites = [[1,0],[2,1]]", "output": "true", "isHidden": true },
      { "input": "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]", "output": "true", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 478,
    "company": "Google",
    "topic": "Heap",
    "category": "Heap",
    "title": "Kth Largest Element in Array",
    "description": "Given an integer array nums and an integer k, return the kth largest element in the array.",
    "constraints": "1 <= k <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
    "sampleInput": "nums = [3,2,1,5,6,4], k = 2",
    "sampleOutput": "5",
    "explanation": "The 2nd largest element is 5.",
    "hints": ["Use min heap of size k", "Or use quickselect algorithm"],
    "difficulty": "medium",
    "testCases": [
      { "input": "nums = [3,2,1,5,6,4], k = 2", "output": "5", "isHidden": false },
      { "input": "nums = [3,2,3,1,2,4,5,5,6], k = 4", "output": "4", "isHidden": true },
      { "input": "nums = [1], k = 1", "output": "1", "isHidden": true },
      { "input": "nums = [2,1], k = 1", "output": "2", "isHidden": true },
      { "input": "nums = [5,5,5,5], k = 2", "output": "5", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 479,
    "company": "Amazon",
    "topic": "Binary Tree",
    "category": "Binary Tree",
    "title": "Binary Tree Level Order Traversal",
    "description": "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
    "constraints": "The number of nodes in the tree is in range [0, 2000]\n-1000 <= Node.val <= 1000",
    "sampleInput": "root = [3,9,20,null,null,15,7]",
    "sampleOutput": "[[3],[9,20],[15,7]]",
    "explanation": "Level 0: [3], Level 1: [9,20], Level 2: [15,7].",
    "hints": ["Use BFS with a queue", "Track level size to separate levels"],
    "difficulty": "medium",
    "testCases": [
      { "input": "root = [3,9,20,null,null,15,7]", "output": "[[3],[9,20],[15,7]]", "isHidden": false },
      { "input": "root = [1]", "output": "[[1]]", "isHidden": true },
      { "input": "root = []", "output": "[]", "isHidden": true },
      { "input": "root = [1,2,3,4,5]", "output": "[[1],[2,3],[4,5]]", "isHidden": true },
      { "input": "root = [1,2,null,3]", "output": "[[1],[2],[3]]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 480,
    "company": "Microsoft",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Product of Array Except Self",
    "description": "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all elements of nums except nums[i].",
    "constraints": "2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30\nThe product of any prefix or suffix is guaranteed to fit in 32-bit integer",
    "sampleInput": "nums = [1,2,3,4]",
    "sampleOutput": "[24,12,8,6]",
    "explanation": "answer[0] = 2*3*4 = 24, answer[1] = 1*3*4 = 12, etc.",
    "hints": ["Calculate left products and right products separately", "Combine them without division"],
    "difficulty": "medium",
    "testCases": [
      { "input": "nums = [1,2,3,4]", "output": "[24,12,8,6]", "isHidden": false },
      { "input": "nums = [-1,1,0,-3,3]", "output": "[0,0,9,0,0]", "isHidden": true },
      { "input": "nums = [2,3]", "output": "[3,2]", "isHidden": true },
      { "input": "nums = [1,1,1,1]", "output": "[1,1,1,1]", "isHidden": true },
      { "input": "nums = [0,0]", "output": "[0,0]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 481,
    "company": "Meta",
    "topic": "LinkedList",
    "category": "LinkedList",
    "title": "Add Two Numbers",
    "description": "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order. Add the two numbers and return the sum as a linked list.",
    "constraints": "The number of nodes in each list is in range [1, 100]\n0 <= Node.val <= 9\nIt is guaranteed that the list represents a number that does not have leading zeros",
    "sampleInput": "l1 = [2,4,3], l2 = [5,6,4]",
    "sampleOutput": "[7,0,8]",
    "explanation": "342 + 465 = 807.",
    "hints": ["Track carry while adding digits", "Create new nodes for result"],
    "difficulty": "medium",
    "testCases": [
      { "input": "l1 = [2,4,3], l2 = [5,6,4]", "output": "[7,0,8]", "isHidden": false },
      { "input": "l1 = [0], l2 = [0]", "output": "[0]", "isHidden": true },
      { "input": "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]", "output": "[8,9,9,9,0,0,0,1]", "isHidden": true },
      { "input": "l1 = [1], l2 = [9,9]", "output": "[0,0,1]", "isHidden": true },
      { "input": "l1 = [5], l2 = [5]", "output": "[0,1]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 482,
    "company": "Apple",
    "topic": "Backtracking",
    "category": "Backtracking",
    "title": "Letter Combinations of Phone Number",
    "description": "Given a string containing digits from 2-9, return all possible letter combinations that the number could represent (like on a phone keypad).",
    "constraints": "0 <= digits.length <= 4\ndigits[i] is a digit in the range ['2', '9']",
    "sampleInput": "digits = \"23\"",
    "sampleOutput": "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]",
    "explanation": "2 maps to 'abc' and 3 maps to 'def'.",
    "hints": ["Use backtracking to build combinations", "Map each digit to its letters"],
    "difficulty": "medium",
    "testCases": [
      { "input": "digits = \"23\"", "output": "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]", "isHidden": false },
      { "input": "digits = \"\"", "output": "[]", "isHidden": true },
      { "input": "digits = \"2\"", "output": "[\"a\",\"b\",\"c\"]", "isHidden": true },
      { "input": "digits = \"234\"", "output": "[\"adg\",\"adh\",\"adi\",\"aeg\",\"aeh\",\"aei\",\"afg\",\"afh\",\"afi\",\"bdg\",\"bdh\",\"bdi\",\"beg\",\"beh\",\"bei\",\"bfg\",\"bfh\",\"bfi\",\"cdg\",\"cdh\",\"cdi\",\"ceg\",\"ceh\",\"cei\",\"cfg\",\"cfh\",\"cfi\"]", "isHidden": true },
      { "input": "digits = \"9\"", "output": "[\"w\",\"x\",\"y\",\"z\"]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 483,
    "company": "Google",
    "topic": "DP",
    "category": "DP",
    "title": "House Robber",
    "description": "You are a robber planning to rob houses. Each house has a certain amount of money. Adjacent houses have security, so you cannot rob adjacent houses. Return the maximum amount you can rob.",
    "constraints": "1 <= nums.length <= 100\n0 <= nums[i] <= 400",
    "sampleInput": "nums = [1,2,3,1]",
    "sampleOutput": "4",
    "explanation": "Rob house 1 (money = 1) and then rob house 3 (money = 3). Total = 1 + 3 = 4.",
    "hints": ["Use DP: dp[i] = max(dp[i-1], dp[i-2] + nums[i])", "Choose between robbing current or skipping"],
    "difficulty": "medium",
    "testCases": [
      { "input": "nums = [1,2,3,1]", "output": "4", "isHidden": false },
      { "input": "nums = [2,7,9,3,1]", "output": "12", "isHidden": true },
      { "input": "nums = [1]", "output": "1", "isHidden": true },
      { "input": "nums = [2,1,1,2]", "output": "4", "isHidden": true },
      { "input": "nums = [5,3,4,11,2]", "output": "16", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 484,
    "company": "Amazon",
    "topic": "Strings",
    "category": "Strings",
    "title": "Valid Parenthesis String",
    "description": "Given a string s containing only '(', ')', and '*', return true if the string is valid. '*' can be treated as '(', ')' or empty string.",
    "constraints": "1 <= s.length <= 100",
    "sampleInput": "s = \"(*))\"",
    "sampleOutput": "true",
    "explanation": "The string can be made valid by treating '*' as '('.",
    "hints": ["Track min and max possible open parentheses", "Adjust ranges based on each character"],
    "difficulty": "medium",
    "testCases": [
      { "input": "s = \"(*))\"", "output": "true", "isHidden": false },
      { "input": "s = \"()\"", "output": "true", "isHidden": true },
      { "input": "s = \"(*)\"", "output": "true", "isHidden": true },
      { "input": "s = \"(*()\"", "output": "true", "isHidden": true },
      { "input": "s = \"((*)\"", "output": "true", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 485,
    "company": "Microsoft",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Container With Most Water",
    "description": "Given n non-negative integers representing height of vertical lines, find two lines that together with x-axis forms a container with most water.",
    "constraints": "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
    "sampleInput": "height = [1,8,6,2,5,4,8,3,7]",
    "sampleOutput": "49",
    "explanation": "The max area is between index 1 and 8: min(8,7) * 7 = 49.",
    "hints": ["Use two pointers from both ends", "Move pointer with smaller height inward"],
    "difficulty": "medium",
    "testCases": [
      { "input": "height = [1,8,6,2,5,4,8,3,7]", "output": "49", "isHidden": false },
      { "input": "height = [1,1]", "output": "1", "isHidden": true },
      { "input": "height = [4,3,2,1,4]", "output": "16", "isHidden": true },
      { "input": "height = [1,2,1]", "output": "2", "isHidden": true },
      { "input": "height = [2,3,4,5,18,17,6]", "output": "17", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 486,
    "company": "Meta",
    "topic": "Binary Search",
    "category": "Binary Search",
    "title": "Search in Rotated Sorted Array",
    "description": "Given a rotated sorted array and a target value, search for the target. If found return its index, otherwise return -1.",
    "constraints": "1 <= nums.length <= 5000\n-10^4 <= nums[i] <= 10^4\nAll values are unique\nnums is rotated at some pivot",
    "sampleInput": "nums = [4,5,6,7,0,1,2], target = 0",
    "sampleOutput": "4",
    "explanation": "0 is at index 4.",
    "hints": ["Use modified binary search", "Determine which half is sorted", "Check if target is in sorted half"],
    "difficulty": "medium",
    "testCases": [
      { "input": "nums = [4,5,6,7,0,1,2], target = 0", "output": "4", "isHidden": false },
      { "input": "nums = [4,5,6,7,0,1,2], target = 3", "output": "-1", "isHidden": true },
      { "input": "nums = [1], target = 0", "output": "-1", "isHidden": true },
      { "input": "nums = [1], target = 1", "output": "0", "isHidden": true },
      { "input": "nums = [3,1], target = 1", "output": "1", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 487,
    "company": "Apple",
    "topic": "Graph",
    "category": "Graph",
    "title": "Pacific Atlantic Water Flow",
    "description": "Given an m x n matrix of heights, find all cells from which water can flow to both Pacific and Atlantic oceans. Water flows from high to low or equal height.",
    "constraints": "m == heights.length\nn == heights[r].length\n1 <= m, n <= 200\n0 <= heights[r][c] <= 10^5",
    "sampleInput": "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]",
    "sampleOutput": "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]",
    "explanation": "Pacific is top/left border, Atlantic is bottom/right border.",
    "hints": ["DFS from both oceans separately", "Find intersection of reachable cells"],
    "difficulty": "medium",
    "testCases": [
      { "input": "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", "output": "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]", "isHidden": false },
      { "input": "heights = [[1]]", "output": "[[0,0]]", "isHidden": true },
      { "input": "heights = [[1,2],[2,1]]", "output": "[[0,0],[0,1],[1,0],[1,1]]", "isHidden": true },
      { "input": "heights = [[3,3,3],[3,1,3],[0,2,4]]", "output": "[[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]]", "isHidden": true },
      { "input": "heights = [[1,1],[1,1],[1,1]]", "output": "[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]]", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 488,
    "company": "Google",
    "topic": "Trie",
    "category": "Trie",
    "title": "Implement Trie",
    "description": "Implement a trie with insert, search, and startsWith methods.",
    "constraints": "1 <= word.length, prefix.length <= 2000\nword and prefix consist only of lowercase English letters\nAt most 3 * 10^4 calls will be made to insert, search, and startsWith",
    "sampleInput": "Trie trie = new Trie(); trie.insert(\"apple\"); trie.search(\"apple\"); trie.startsWith(\"app\");",
    "sampleOutput": "true, false, true",
    "explanation": "Create trie, insert apple, search returns true, startsWith app returns true.",
    "hints": ["Use tree structure with 26 children per node", "Mark end of word nodes"],
    "difficulty": "medium",
    "testCases": [
      { "input": "insert(\"apple\"), search(\"apple\")", "output": "true", "isHidden": false },
      { "input": "insert(\"apple\"), search(\"app\")", "output": "false", "isHidden": true },
      { "input": "insert(\"apple\"), startsWith(\"app\")", "output": "true", "isHidden": true },
      { "input": "insert(\"apple\"), insert(\"app\"), search(\"app\")", "output": "true", "isHidden": true },
      { "input": "startsWith(\"a\")", "output": "false", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 489,
    "company": "Amazon",
    "topic": "DP",
    "category": "DP",
    "title": "Unique Paths",
    "description": "A robot is on an m x n grid at top-left corner. It can only move down or right. How many possible unique paths are there to reach bottom-right corner?",
    "constraints": "1 <= m, n <= 100",
    "sampleInput": "m = 3, n = 7",
    "sampleOutput": "28",
    "explanation": "There are 28 unique paths from top-left to bottom-right.",
    "hints": ["Use DP: dp[i][j] = dp[i-1][j] + dp[i][j-1]", "Or use combinatorics"],
    "difficulty": "medium",
    "testCases": [
      { "input": "m = 3, n = 7", "output": "28", "isHidden": false },
      { "input": "m = 3, n = 2", "output": "3", "isHidden": true },
      { "input": "m = 1, n = 1", "output": "1", "isHidden": true },
      { "input": "m = 2, n = 2", "output": "2", "isHidden": true },
      { "input": "m = 10, n = 10", "output": "48620", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 490,
    "company": "Microsoft",
    "topic": "LinkedList",
    "category": "LinkedList",
    "title": "Remove Nth Node From End",
    "description": "Given the head of a linked list, remove the nth node from the end of the list and return its head.",
    "constraints": "The number of nodes in the list is sz\n1 <= sz <= 30\n0 <= Node.val <= 100\n1 <= n <= sz",
    "sampleInput": "head = [1,2,3,4,5], n = 2",
    "sampleOutput": "[1,2,3,5]",
    "explanation": "Remove the 2nd node from end (node with value 4).",
    "hints": ["Use two pointers n steps apart", "Move both until fast reaches end"],
    "difficulty": "medium",
    "testCases": [
      { "input": "head = [1,2,3,4,5], n = 2", "output": "[1,2,3,5]", "isHidden": false },
      { "input": "head = [1], n = 1", "output": "[]", "isHidden": true },
      { "input": "head = [1,2], n = 1", "output": "[1]", "isHidden": true },
      { "input": "head = [1,2], n = 2", "output": "[2]", "isHidden": true },
      { "input": "head = [1,2,3], n = 3", "output": "[2,3]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 491,
    "company": "Meta",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Subarray Sum Equals K",
    "description": "Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.",
    "constraints": "1 <= nums.length <= 2 * 10^4\n-1000 <= nums[i] <= 1000\n-10^7 <= k <= 10^7",
    "sampleInput": "nums = [1,1,1], k = 2",
    "sampleOutput": "2",
    "explanation": "Subarrays [1,1] appear twice.",
    "hints": ["Use prefix sum with HashMap", "Track count of each prefix sum seen"],
    "difficulty": "medium",
    "testCases": [
      { "input": "nums = [1,1,1], k = 2", "output": "2", "isHidden": false },
      { "input": "nums = [1,2,3], k = 3", "output": "2", "isHidden": true },
      { "input": "nums = [1], k = 0", "output": "0", "isHidden": true },
      { "input": "nums = [1,-1,0], k = 0", "output": "3", "isHidden": true },
      { "input": "nums = [-1,-1,1], k = 0", "output": "1", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 492,
    "company": "Apple",
    "topic": "Backtracking",
    "category": "Backtracking",
    "title": "Generate Parentheses",
    "description": "Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.",
    "constraints": "1 <= n <= 8",
    "sampleInput": "n = 3",
    "sampleOutput": "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]",
    "explanation": "All valid combinations of 3 pairs of parentheses.",
    "hints": ["Use backtracking", "Track count of open and close parentheses", "Add '(' if open < n, ')' if close < open"],
    "difficulty": "medium",
    "testCases": [
      { "input": "n = 3", "output": "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]", "isHidden": false },
      { "input": "n = 1", "output": "[\"()\"]", "isHidden": true },
      { "input": "n = 2", "output": "[\"(())\",\"()()\"]", "isHidden": true },
      { "input": "n = 4", "output": "[\"(((())))\",\"((()()))\",\"((())())\",\"((()))()\",\"(()(()))\",\"(()()())\",\"(()())()\",\"(())(())\",\"(())()()\",\"()((()))\",\"()(()())\",\"()(())()\",\"()()(())\",\"()()()()\"]", "isHidden": true },
      { "input": "n = 5", "output": "42", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 493,
    "company": "Google",
    "topic": "DP",
    "category": "DP",
    "title": "Edit Distance",
    "description": "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. Operations: insert, delete, replace.",
    "constraints": "0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters",
    "sampleInput": "word1 = \"horse\", word2 = \"ros\"",
    "sampleOutput": "3",
    "explanation": "horse -> rorse (replace 'h' with 'r'), rorse -> rose (remove 'r'), rose -> ros (remove 'e').",
    "hints": ["Use 2D DP", "dp[i][j] = min operations to convert word1[0..i] to word2[0..j]"],
    "difficulty": "hard",
    "testCases": [
      { "input": "word1 = \"horse\", word2 = \"ros\"", "output": "3", "isHidden": false },
      { "input": "word1 = \"intention\", word2 = \"execution\"", "output": "5", "isHidden": true },
      { "input": "word1 = \"\", word2 = \"a\"", "output": "1", "isHidden": true },
      { "input": "word1 = \"a\", word2 = \"\"", "output": "1", "isHidden": true },
      { "input": "word1 = \"abc\", word2 = \"abc\"", "output": "0", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 494,
    "company": "Amazon",
    "topic": "Binary Search",
    "category": "Binary Search",
    "title": "Find Minimum in Rotated Sorted Array",
    "description": "Suppose an array sorted in ascending order is rotated. Find the minimum element. The array may contain duplicates.",
    "constraints": "n == nums.length\n1 <= n <= 5000\n-5000 <= nums[i] <= 5000\nnums is rotated between 1 and n times",
    "sampleInput": "nums = [3,4,5,1,2]",
    "sampleOutput": "1",
    "explanation": "The minimum element is 1.",
    "hints": ["Use binary search", "Compare middle with right to determine which half to search"],
    "difficulty": "hard",
    "testCases": [
      { "input": "nums = [3,4,5,1,2]", "output": "1", "isHidden": false },
      { "input": "nums = [4,5,6,7,0,1,2]", "output": "0", "isHidden": true },
      { "input": "nums = [11,13,15,17]", "output": "11", "isHidden": true },
      { "input": "nums = [2,2,2,0,1]", "output": "0", "isHidden": true },
      { "input": "nums = [1]", "output": "1", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 495,
    "company": "Microsoft",
    "topic": "Graph",
    "category": "Graph",
    "title": "Word Ladder",
    "description": "Given two words beginWord and endWord, and a dictionary wordList, find the shortest transformation sequence from beginWord to endWord. Only one letter can change at a time.",
    "constraints": "1 <= beginWord.length <= 10\nendWord.length == beginWord.length\n1 <= wordList.length <= 5000\nwordList[i].length == beginWord.length\nAll words contain only lowercase English letters",
    "sampleInput": "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]",
    "sampleOutput": "5",
    "explanation": "hit -> hot -> dot -> dog -> cog.",
    "hints": ["Use BFS to find shortest path", "Build graph of word transformations"],
    "difficulty": "hard",
    "testCases": [
      { "input": "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", "output": "5", "isHidden": false },
      { "input": "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\"]", "output": "0", "isHidden": true },
      { "input": "beginWord = \"a\", endWord = \"c\", wordList = [\"a\",\"b\",\"c\"]", "output": "2", "isHidden": true },
      { "input": "beginWord = \"hot\", endWord = \"dog\", wordList = [\"hot\",\"dog\"]", "output": "0", "isHidden": true },
      { "input": "beginWord = \"qa\", endWord = \"sq\", wordList = [\"si\",\"go\",\"se\",\"cm\",\"so\",\"ph\",\"mt\",\"db\",\"mb\",\"sb\",\"kr\",\"ln\",\"tm\",\"le\",\"av\",\"sm\",\"ar\",\"ci\",\"ca\",\"br\",\"ti\",\"ba\",\"to\",\"ra\",\"fa\",\"yo\",\"ow\",\"sn\",\"ya\",\"cr\",\"po\",\"fe\",\"ho\",\"ma\",\"re\",\"or\",\"rn\",\"au\",\"ur\",\"rh\",\"sr\",\"tc\",\"lt\",\"lo\",\"as\",\"fr\",\"nb\",\"yb\",\"if\",\"pb\",\"ge\",\"th\",\"pm\",\"rb\",\"sh\",\"co\",\"ga\",\"li\",\"ha\",\"hz\",\"no\",\"bi\",\"di\",\"hi\",\"qa\",\"pi\",\"os\",\"uh\",\"wm\",\"an\",\"me\",\"mo\",\"na\",\"la\",\"st\",\"er\",\"sc\",\"ne\",\"mn\",\"mi\",\"am\",\"ex\",\"pt\",\"io\",\"be\",\"fm\",\"ta\",\"tb\",\"ni\",\"mr\",\"pa\",\"he\",\"lr\",\"sq\",\"ye\"]", "output": "5", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 496,
    "company": "Meta",
    "topic": "DP",
    "category": "DP",
    "title": "Longest Increasing Subsequence",
    "description": "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    "constraints": "1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4",
    "sampleInput": "nums = [10,9,2,5,3,7,101,18]",
    "sampleOutput": "4",
    "explanation": "The longest increasing subsequence is [2,3,7,101], length 4.",
    "hints": ["Use DP where dp[i] = longest LIS ending at i", "Or use binary search with patience sorting for O(n log n)"],
    "difficulty": "hard",
    "testCases": [
      { "input": "nums = [10,9,2,5,3,7,101,18]", "output": "4", "isHidden": false },
      { "input": "nums = [0,1,0,3,2,3]", "output": "4", "isHidden": true },
      { "input": "nums = [7,7,7,7,7,7,7]", "output": "1", "isHidden": true },
      { "input": "nums = [1,3,6,7,9,4,10,5,6]", "output": "6", "isHidden": true },
      { "input": "nums = [4,10,4,3,8,9]", "output": "3", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 497,
    "company": "Apple",
    "topic": "Heap",
    "category": "Heap",
    "title": "Merge K Sorted Lists",
    "description": "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    "constraints": "k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4\nlists[i] is sorted in ascending order",
    "sampleInput": "lists = [[1,4,5],[1,3,4],[2,6]]",
    "sampleOutput": "[1,1,2,3,4,4,5,6]",
    "explanation": "Merge all lists into one sorted list.",
    "hints": ["Use min heap to track smallest current node", "Extract min and add its next to heap"],
    "difficulty": "hard",
    "testCases": [
      { "input": "lists = [[1,4,5],[1,3,4],[2,6]]", "output": "[1,1,2,3,4,4,5,6]", "isHidden": false },
      { "input": "lists = []", "output": "[]", "isHidden": true },
      { "input": "lists = [[]]", "output": "[]", "isHidden": true },
      { "input": "lists = [[1],[2],[3]]", "output": "[1,2,3]", "isHidden": true },
      { "input": "lists = [[1,2,3],[4,5,6],[7,8,9]]", "output": "[1,2,3,4,5,6,7,8,9]", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 498,
    "company": "Google",
    "topic": "Backtracking",
    "category": "Backtracking",
    "title": "N-Queens",
    "description": "The n-queens puzzle is to place n queens on an n×n chessboard so that no two queens attack each other. Return all distinct solutions.",
    "constraints": "1 <= n <= 9",
    "sampleInput": "n = 4",
    "sampleOutput": "[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]",
    "explanation": "Two distinct solutions for 4-queens.",
    "hints": ["Use backtracking", "Track columns, diagonals used", "Place queen row by row"],
    "difficulty": "hard",
    "testCases": [
      { "input": "n = 4", "output": "[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]", "isHidden": false },
      { "input": "n = 1", "output": "[[\"Q\"]]", "isHidden": true },
      { "input": "n = 2", "output": "[]", "isHidden": true },
      { "input": "n = 3", "output": "[]", "isHidden": true },
      { "input": "n = 5", "output": "10", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 499,
    "company": "Amazon",
    "topic": "DP",
    "category": "DP",
    "title": "Regular Expression Matching",
    "description": "Given a string s and pattern p, implement regular expression matching with support for '.' and '*'. '.' matches any single character. '*' matches zero or more of the preceding element.",
    "constraints": "1 <= s.length <= 20\n1 <= p.length <= 30\ns contains only lowercase English letters\np contains only lowercase English letters, '.', and '*'",
    "sampleInput": "s = \"aa\", p = \"a*\"",
    "sampleOutput": "true",
    "explanation": "'*' means zero or more 'a's.",
    "hints": ["Use 2D DP", "dp[i][j] = match s[0..i] with p[0..j]", "Handle '*' by trying zero or more matches"],
    "difficulty": "hard",
    "testCases": [
      { "input": "s = \"aa\", p = \"a*\"", "output": "true", "isHidden": false },
      { "input": "s = \"aa\", p = \"a\"", "output": "false", "isHidden": true },
      { "input": "s = \"ab\", p = \".*\"", "output": "true", "isHidden": true },
      { "input": "s = \"mississippi\", p = \"mis*is*p*.\"", "output": "false", "isHidden": true },
      { "input": "s = \"aab\", p = \"c*a*b\"", "output": "true", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 500,
    "company": "Microsoft",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "Trapping Rain Water",
    "description": "Given n non-negative integers representing an elevation map where width of each bar is 1, compute how much water it can trap after raining.",
    "constraints": "n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
    "sampleInput": "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
    "sampleOutput": "6",
    "explanation": "6 units of rain water are trapped.",
    "hints": ["For each position, water level = min(max_left, max_right) - height", "Use two pointers or precompute max arrays"],
    "difficulty": "hard",
    "testCases": [
      { "input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]", "output": "6", "isHidden": false },
      { "input": "height = [4,2,0,3,2,5]", "output": "9", "isHidden": true },
      { "input": "height = [1,1,1,1]", "output": "0", "isHidden": true },
      { "input": "height = [3,0,2,0,4]", "output": "7", "isHidden": true },
      { "input": "height = [5,4,1,2]", "output": "1", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 501,
    "company": "Meta",
    "topic": "Graph",
    "category": "Graph",
    "title": "Alien Dictionary",
    "description": "There is a new alien language with a sorted dictionary. Derive the order of letters in this alien language from the given dictionary.",
    "constraints": "1 <= words.length <= 100\n1 <= words[i].length <= 100\nwords[i] consists of only lowercase English letters",
    "sampleInput": "words = [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]",
    "sampleOutput": "\"wertf\"",
    "explanation": "From the dictionary, we derive the order: w < e < r < t < f.",
    "hints": ["Build graph from adjacent word pairs", "Use topological sort", "Detect cycles for invalid input"],
    "difficulty": "hard",
    "testCases": [
      { "input": "words = [\"wrt\",\"wrf\",\"er\",\"ett\",\"rftt\"]", "output": "\"wertf\"", "isHidden": false },
      { "input": "words = [\"z\",\"x\"]", "output": "\"zx\"", "isHidden": true },
      { "input": "words = [\"z\",\"x\",\"z\"]", "output": "\"\"", "isHidden": true },
      { "input": "words = [\"abc\",\"ab\"]", "output": "\"\"", "isHidden": true },
      { "input": "words = [\"a\",\"b\",\"ca\",\"cc\"]", "output": "\"abc\"", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 502,
    "company": "Apple",
    "topic": "Binary Tree",
    "category": "Binary Tree",
    "title": "Binary Tree Maximum Path Sum",
    "description": "Given the root of a binary tree, return the maximum path sum of any non-empty path. A path can start and end at any node.",
    "constraints": "The number of nodes in the tree is in range [1, 3 * 10^4]\n-1000 <= Node.val <= 1000",
    "sampleInput": "root = [1,2,3]",
    "sampleOutput": "6",
    "explanation": "The optimal path is 2 -> 1 -> 3 with sum 6.",
    "hints": ["Use post-order traversal", "For each node, max path = node + max(left, 0) + max(right, 0)", "Track global maximum"],
    "difficulty": "hard",
    "testCases": [
      { "input": "root = [1,2,3]", "output": "6", "isHidden": false },
      { "input": "root = [-10,9,20,null,null,15,7]", "output": "42", "isHidden": true },
      { "input": "root = [1]", "output": "1", "isHidden": true },
      { "input": "root = [-3]", "output": "-3", "isHidden": true },
      { "input": "root = [2,-1,-2]", "output": "2", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 503,
    "company": "Google",
    "topic": "Sliding Window",
    "category": "Sliding Window",
    "title": "Minimum Window Substring",
    "description": "Given strings s and t, return the minimum window substring of s such that every character in t is included in the window. If no such substring exists, return empty string.",
    "constraints": "m == s.length\nn == t.length\n1 <= m, n <= 10^5\ns and t consist of uppercase and lowercase English letters",
    "sampleInput": "s = \"ADOBECODEBANC\", t = \"ABC\"",
    "sampleOutput": "\"BANC\"",
    "explanation": "The minimum window substring \"BANC\" includes 'A', 'B', and 'C' from string t.",
    "hints": ["Use sliding window with two pointers", "Track character counts with HashMap", "Expand right, contract left when valid"],
    "difficulty": "hard",
    "testCases": [
      { "input": "s = \"ADOBECODEBANC\", t = \"ABC\"", "output": "\"BANC\"", "isHidden": false },
      { "input": "s = \"a\", t = \"a\"", "output": "\"a\"", "isHidden": true },
      { "input": "s = \"a\", t = \"aa\"", "output": "\"\"", "isHidden": true },
      { "input": "s = \"ab\", t = \"b\"", "output": "\"b\"", "isHidden": true },
      { "input": "s = \"abc\", t = \"cba\"", "output": "\"abc\"", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 504,
    "company": "Amazon",
    "topic": "DP",
    "category": "DP",
    "title": "Best Time to Buy and Sell Stock III",
    "description": "You may complete at most two transactions. Find the maximum profit you can achieve. You must sell the stock before you buy again.",
    "constraints": "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^5",
    "sampleInput": "prices = [3,3,5,0,0,3,1,4]",
    "sampleOutput": "6",
    "explanation": "Buy on day 4 (price = 0) and sell on day 6 (price = 3), profit = 3. Then buy on day 7 (price = 1) and sell on day 8 (price = 4), profit = 3. Total = 6.",
    "hints": ["Track buy1, sell1, buy2, sell2 states", "Update each state based on current price"],
    "difficulty": "hard",
    "testCases": [
      { "input": "prices = [3,3,5,0,0,3,1,4]", "output": "6", "isHidden": false },
      { "input": "prices = [1,2,3,4,5]", "output": "4", "isHidden": true },
      { "input": "prices = [7,6,4,3,1]", "output": "0", "isHidden": true },
      { "input": "prices = [1]", "output": "0", "isHidden": true },
      { "input": "prices = [2,1,2,0,1]", "output": "2", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 505,
    "company": "Microsoft",
    "topic": "Union Find",
    "category": "Union Find",
    "title": "Accounts Merge",
    "description": "Given a list of accounts where each element is a list of strings, the first element is name and the rest are emails. Merge accounts that belong to the same person.",
    "constraints": "1 <= accounts.length <= 1000\n2 <= accounts[i].length <= 10\n1 <= accounts[i][j].length <= 30\naccounts[i][0] consists of English letters\naccounts[i][j] (j > 0) is a valid email",
    "sampleInput": "accounts = [[\"John\",\"john@mail.com\",\"john_work@mail.com\"],[\"John\",\"john@mail.com\",\"john_home@mail.com\"]]",
    "sampleOutput": "[[\"John\",\"john@mail.com\",\"john_home@mail.com\",\"john_work@mail.com\"]]",
    "explanation": "Both accounts belong to the same John.",
    "hints": ["Use Union-Find to group emails", "Map each email to its owner", "Merge connected components"],
    "difficulty": "hard",
    "testCases": [
      { "input": "accounts = [[\"John\",\"john@mail.com\",\"john_work@mail.com\"],[\"John\",\"john@mail.com\",\"john_home@mail.com\"]]", "output": "[[\"John\",\"john@mail.com\",\"john_home@mail.com\",\"john_work@mail.com\"]]", "isHidden": false },
      { "input": "accounts = [[\"Gabe\",\"gabe@mail.com\",\"gabe_work@mail.com\"],[\"Kevin\",\"kevin@mail.com\"],[\"Gabe\",\"gabe@mail.com\"]]", "output": "[[\"Gabe\",\"gabe@mail.com\",\"gabe_work@mail.com\"],[\"Kevin\",\"kevin@mail.com\"]]", "isHidden": true },
      { "input": "accounts = [[\"David\",\"david0@mail.com\",\"david1@mail.com\"],[\"David\",\"david3@mail.com\",\"david4@mail.com\"],[\"David\",\"david4@mail.com\",\"david5@mail.com\"]]", "output": "[[\"David\",\"david0@mail.com\",\"david1@mail.com\"],[\"David\",\"david3@mail.com\",\"david4@mail.com\",\"david5@mail.com\"]]", "isHidden": true },
      { "input": "accounts = [[\"Alice\",\"alice@mail.com\"]]", "output": "[[\"Alice\",\"alice@mail.com\"]]", "isHidden": true },
      { "input": "accounts = [[\"John\",\"a@mail.com\",\"b@mail.com\"],[\"John\",\"c@mail.com\",\"d@mail.com\"],[\"John\",\"a@mail.com\",\"c@mail.com\"]]", "output": "[[\"John\",\"a@mail.com\",\"b@mail.com\",\"c@mail.com\",\"d@mail.com\"]]", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 506,
    "company": "Meta",
    "topic": "Arrays",
    "category": "Arrays",
    "title": "First Missing Positive",
    "description": "Given an unsorted integer array nums, return the smallest missing positive integer. Implement in O(n) time and O(1) space.",
    "constraints": "1 <= nums.length <= 10^5\n-2^31 <= nums[i] <= 2^31 - 1",
    "sampleInput": "nums = [3,4,-1,1]",
    "sampleOutput": "2",
    "explanation": "1 is present, but 2 is missing.",
    "hints": ["Use array itself as hash table", "Place each number at its correct index", "First index without correct number is answer"],
    "difficulty": "hard",
    "testCases": [
      { "input": "nums = [3,4,-1,1]", "output": "2", "isHidden": false },
      { "input": "nums = [1,2,0]", "output": "3", "isHidden": true },
      { "input": "nums = [7,8,9,11,12]", "output": "1", "isHidden": true },
      { "input": "nums = [1]", "output": "2", "isHidden": true },
      { "input": "nums = [2,3,4]", "output": "1", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 507,
    "company": "Apple",
    "topic": "Strings",
    "category": "Strings",
    "title": "Palindrome Pairs",
    "description": "Given a list of unique words, return all pairs of indices (i, j) such that the concatenation of words[i] + words[j] is a palindrome.",
    "constraints": "1 <= words.length <= 5000\n0 <= words[i].length <= 300\nwords[i] consists of lowercase English letters",
    "sampleInput": "words = [\"abcd\",\"dcba\",\"lls\",\"s\",\"sssll\"]",
    "sampleOutput": "[[0,1],[1,0],[3,2],[2,4]]",
    "explanation": "\"abcddcba\", \"dcbaabcd\", \"slls\", \"llssssll\" are all palindromes.",
    "hints": ["Use Trie or HashMap", "For each word, check all possible splits", "Check if prefix + reversed suffix exists"],
    "difficulty": "hard",
    "testCases": [
      { "input": "words = [\"abcd\",\"dcba\",\"lls\",\"s\",\"sssll\"]", "output": "[[0,1],[1,0],[3,2],[2,4]]", "isHidden": false },
      { "input": "words = [\"bat\",\"tab\",\"cat\"]", "output": "[[0,1],[1,0]]", "isHidden": true },
      { "input": "words = [\"a\",\"\"]", "output": "[[0,1],[1,0]]", "isHidden": true },
      { "input": "words = [\"abc\",\"cba\"]", "output": "[[0,1],[1,0]]", "isHidden": true },
      { "input": "words = [\"a\",\"abc\",\"aba\",\"\"]", "output": "[[0,3],[2,3],[3,0],[3,2]]", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 508,
    "company": "Google",
    "topic": "DP",
    "category": "DP",
    "title": "Burst Balloons",
    "description": "You are given n balloons, indexed from 0 to n-1. Each balloon has a number on it. Burst all balloons to collect maximum coins. When you burst balloon i, you get nums[i-1] * nums[i] * nums[i+1] coins.",
    "constraints": "n == nums.length\n1 <= n <= 300\n0 <= nums[i] <= 100",
    "sampleInput": "nums = [3,1,5,8]",
    "sampleOutput": "167",
    "explanation": "Optimal order: burst 1, then 5, then 3, finally 8 for max coins.",
    "hints": ["Think backwards: which balloon to burst last", "Use interval DP", "dp[i][j] = max coins for bursting balloons between i and j"],
    "difficulty": "hard",
    "testCases": [
      { "input": "nums = [3,1,5,8]", "output": "167", "isHidden": false },
      { "input": "nums = [1,5]", "output": "10", "isHidden": true },
      { "input": "nums = [1]", "output": "1", "isHidden": true },
      { "input": "nums = [9,76,64,21,97,60]", "output": "1086136", "isHidden": true },
      { "input": "nums = [8,2,6,8,9,8,1,4,1,5,3,0,7,7]", "output": "1717", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 509,
    "company": "Amazon",
    "topic": "Binary Search",
    "category": "Binary Search",
    "title": "Median of Two Sorted Arrays",
    "description": "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. The algorithm should run in O(log(m+n)) time.",
    "constraints": "nums1.length == m\nnums2.length == n\n0 <= m <= 1000\n0 <= n <= 1000\n1 <= m + n <= 2000\n-10^6 <= nums1[i], nums2[i] <= 10^6",
    "sampleInput": "nums1 = [1,3], nums2 = [2]",
    "sampleOutput": "2.0",
    "explanation": "Merged array = [1,2,3] and median is 2.",
    "hints": ["Use binary search on smaller array", "Partition both arrays to find correct split", "Ensure left max <= right min"],
    "difficulty": "hard",
    "testCases": [
      { "input": "nums1 = [1,3], nums2 = [2]", "output": "2.0", "isHidden": false },
      { "input": "nums1 = [1,2], nums2 = [3,4]", "output": "2.5", "isHidden": true },
      { "input": "nums1 = [], nums2 = [1]", "output": "1.0", "isHidden": true },
      { "input": "nums1 = [2], nums2 = []", "output": "2.0", "isHidden": true },
      { "input": "nums1 = [1,3,5,7,9], nums2 = [2,4,6,8,10]", "output": "5.5", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 510,
    "company": "Microsoft",
    "topic": "Graph",
    "category": "Graph",
    "title": "Network Delay Time",
    "description": "You are given a network of n nodes labeled 1 to n. Given times array representing signal travel times as [u, v, w] where u is source, v is target, and w is time. Return minimum time for all nodes to receive signal from node k.",
    "constraints": "1 <= k <= n <= 100\n1 <= times.length <= 6000\ntimes[i].length == 3\n1 <= ui, vi <= n\nui != vi\n0 <= wi <= 100\nAll pairs (ui, vi) are unique",
    "sampleInput": "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2",
    "sampleOutput": "2",
    "explanation": "Signal reaches node 1 at time 1, node 3 at time 1, and node 4 at time 2.",
    "hints": ["Use Dijkstra's algorithm", "Or use Bellman-Ford for simpler implementation", "Track shortest path to all nodes from k"],
    "difficulty": "medium",
    "testCases": [
      { "input": "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2", "output": "2", "isHidden": false },
      { "input": "times = [[1,2,1]], n = 2, k = 1", "output": "1", "isHidden": true },
      { "input": "times = [[1,2,1]], n = 2, k = 2", "output": "-1", "isHidden": true },
      { "input": "times = [[1,2,1],[2,3,2],[1,3,4]], n = 3, k = 1", "output": "3", "isHidden": true },
      { "input": "times = [[1,2,1],[2,1,3]], n = 2, k = 2", "output": "3", "isHidden": true }
    ],
    "isPremium": false
  },
  {
    "sourceId": 511,
    "company": "Meta",
    "topic": "DP",
    "category": "DP",
    "title": "Maximal Rectangle",
    "description": "Given a 2D binary matrix filled with 0's and 1's, find the largest rectangle containing only 1's and return its area.",
    "constraints": "rows == matrix.length\ncols == matrix[i].length\n1 <= row, cols <= 200\nmatrix[i][j] is '0' or '1'",
    "sampleInput": "matrix = [[\"1\",\"0\",\"1\",\"0\",\"0\"],[\"1\",\"0\",\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\",\"1\",\"1\"],[\"1\",\"0\",\"0\",\"1\",\"0\"]]",
    "sampleOutput": "6",
    "explanation": "The maximal rectangle has area 6.",
    "hints": ["Convert to histogram problem for each row", "Use stack to find largest rectangle in histogram", "Track heights array cumulatively"],
    "difficulty": "hard",
    "testCases": [
      { "input": "matrix = [[\"1\",\"0\",\"1\",\"0\",\"0\"],[\"1\",\"0\",\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\",\"1\",\"1\"],[\"1\",\"0\",\"0\",\"1\",\"0\"]]", "output": "6", "isHidden": false },
      { "input": "matrix = [[\"0\"]]", "output": "0", "isHidden": true },
      { "input": "matrix = [[\"1\"]]", "output": "1", "isHidden": true },
      { "input": "matrix = [[\"0\",\"0\"]]", "output": "0", "isHidden": true },
      { "input": "matrix = [[\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\"],[\"1\",\"1\",\"1\"]]", "output": "9", "isHidden": true }
    ],
    "isPremium": true
  },
  {
    "sourceId": 512,
    "company": "Apple",
    "topic": "Trie",
    "category": "Trie",
    "title": "Word Search II",
    "description": "Given an m x n board of characters and a list of strings words, return all words on the board. Each word must be constructed from letters of adjacent cells.",
    "constraints": "m == board.length\nn == board[i].length\n1 <= m, n <= 12\nboard[i][j] is a lowercase English letter\n1 <= words.length <= 3 * 10^4\n1 <= words[i].length <= 10\nwords[i] consists of lowercase English letters\nAll words[i] are unique",
    "sampleInput": "board = [[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]], words = [\"oath\",\"pea\",\"eat\",\"rain\"]",
    "sampleOutput": "[\"eat\",\"oath\"]",
    "explanation": "\"eat\" and \"oath\" can be found on the board.",
    "hints": ["Build Trie from words list", "DFS from each cell following Trie paths", "Mark cells as visited during DFS"],
    "difficulty": "hard",
    "testCases": [
      { "input": "board = [[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]], words = [\"oath\",\"pea\",\"eat\",\"rain\"]", "output": "[\"eat\",\"oath\"]", "isHidden": false },
      { "input": "board = [[\"a\",\"b\"],[\"c\",\"d\"]], words = [\"abcb\"]", "output": "[]", "isHidden": true },
      { "input": "board = [[\"a\"]], words = [\"a\"]", "output": "[\"a\"]", "isHidden": true },
      { "input": "board = [[\"a\",\"a\"]], words = [\"aaa\"]", "output": "[]", "isHidden": true },
      { "input": "board = [[\"a\",\"b\"],[\"a\",\"a\"]], words = [\"aba\",\"baa\",\"bab\",\"aaab\"]", "output": "[\"aba\",\"baa\"]", "isHidden": true }
    ],
    "isPremium": true
  }
];

function normalizeDifficulty(value = 'easy') {
  const normalized = String(value || '').trim().toLowerCase();
  return ['easy', 'medium', 'hard'].includes(normalized) ? normalized : 'easy';
}

function normalizeTopic(value = 'General') {
  const normalized = String(value || 'General').trim();
  const map = {
    LinkedList: 'Linked List',
    HashMap: 'Hash Map',
  };
  return map[normalized] || normalized || 'General';
}

function normalizeTestCases(testCases = [], sampleInput = '', sampleOutput = '') {
  const cleaned = testCases
    .filter((testCase) => testCase && typeof testCase === 'object')
    .map((testCase) => ({
      input: String(testCase.input ?? '').trim(),
      output: String(testCase.output ?? '').trim(),
      isHidden: Boolean(testCase.isHidden),
    }))
    .filter((testCase) => testCase.input.length || testCase.output.length);

  if (cleaned.length) return cleaned;

  return [{ input: String(sampleInput || '').trim(), output: String(sampleOutput || '').trim(), isHidden: false }];
}

function fixKnownIssues(question) {
  const clone = JSON.parse(JSON.stringify(question));

  if (clone.sourceId === 448) {
    clone.testCases = (clone.testCases || []).filter((testCase) => !String(testCase.input).includes('[1,2,1,3,5,6,4]'));
  }

  return clone;
}

function buildDocument(question) {
  const fixed = fixKnownIssues(question);
  const topic = normalizeTopic(fixed.topic);
  const category = normalizeTopic(fixed.category || fixed.topic);

  return {
    sourceId: Number(fixed.sourceId),
    company: String(fixed.company || 'General').trim() || 'General',
    topic,
    category,
    title: String(fixed.title || 'Untitled Coding Question').trim(),
    description: String(fixed.description || fixed.title || 'No description provided.').trim(),
    constraints: String(fixed.constraints || '').trim(),
    sampleInput: String(fixed.sampleInput || '').trim(),
    sampleOutput: String(fixed.sampleOutput || '').trim(),
    explanation: String(fixed.explanation || '').trim(),
    hints: Array.isArray(fixed.hints) ? fixed.hints.map((hint) => String(hint).trim()).filter(Boolean) : [],
    difficulty: normalizeDifficulty(fixed.difficulty),
    testCases: normalizeTestCases(fixed.testCases, fixed.sampleInput, fixed.sampleOutput),
    isPremium: Boolean(fixed.isPremium),
  };
}

async function run() {
  try {
    await connectDB();

    let inserted = 0;
    let updated = 0;

    for (const question of rawQuestions) {
      const document = buildDocument(question);
      const existing = await CodingQuestion.findOne({ sourceId: document.sourceId }).select('_id').lean();

      await CodingQuestion.findOneAndUpdate(
        { sourceId: document.sourceId },
        { $set: document },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (existing) updated += 1;
      else inserted += 1;
    }

    console.log(`Imported coding questions successfully. Inserted: ${inserted}, Updated: ${updated}`);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

run();