const companyFilter = document.getElementById('companyFilter');
const topicFilter = document.getElementById('topicFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
const resultsMeta = document.getElementById('resultsMeta');
const activeQuestionStatus = document.getElementById('activeQuestionStatus');
const premiumModal = document.getElementById('premiumModal');
const premiumCloseBtn = document.getElementById('premiumCloseBtn');
const payNowBtn = document.getElementById('payNowBtn');
const problemTitle = document.getElementById('problemTitle');
const problemDifficulty = document.getElementById('problemDifficulty');
const problemCompany = document.getElementById('problemCompany');
const problemDescription = document.getElementById('problemDescription');
const problemConstraints = document.getElementById('problemConstraints');
const problemSampleInput = document.getElementById('problemSampleInput');
const problemSampleOutput = document.getElementById('problemSampleOutput');
const problemExplanation = document.getElementById('problemExplanation');
const problemHints = document.getElementById('problemHints');
const toggleHintsBtn = document.getElementById('toggleHintsBtn');
const languageSelect = document.getElementById('languageSelect');
const timerLauncherBtn = document.getElementById('timerLauncherBtn');
const timerSetupModal = document.getElementById('timerSetupModal');
const timerMinutesInput = document.getElementById('timerMinutesInput');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerStopBtn = document.getElementById('timerStopBtn');
const runCodeBtn = document.getElementById('runCodeBtn');
const submitCodeBtn = document.getElementById('submitCodeBtn');
const nextAfterSubmitBtn = document.getElementById('nextAfterSubmitBtn');
const editorContainer = document.getElementById('editorContainer');
const monacoLoaderState = document.getElementById('monacoLoaderState');
const timeUpModal = document.getElementById('timeUpModal');
const timeUpCloseBtn = document.getElementById('timeUpCloseBtn');
const timeUpSubmitBtn = document.getElementById('timeUpSubmitBtn');
const timeUpRetryBtn = document.getElementById('timeUpRetryBtn');
const submissionStatus = document.getElementById('submissionStatus');
const submissionRuntime = document.getElementById('submissionRuntime');
const submissionMemory = document.getElementById('submissionMemory');
const runInput = document.getElementById('runInput');
const expectedOutput = document.getElementById('expectedOutput');
const userOutput = document.getElementById('userOutput');
const executionResult = document.getElementById('executionResult');
const consoleOutput = document.getElementById('consoleOutput');
const terminalTabs = Array.from(document.querySelectorAll('.terminal-tab'));
const summarySubtask = document.getElementById('summarySubtask');
const summaryResult = document.getElementById('summaryResult');
const summaryScore = document.getElementById('summaryScore');
const summaryFooter = document.getElementById('summaryFooter');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const customInputEditor = document.getElementById('customInputEditor');
const API_BASE_URL = window.location.origin.includes(':5000') ? '/api' : 'http://localhost:5000/api';
const RUN_ENDPOINT = '/api/run';
const SUBMIT_ENDPOINT = `${API_BASE_URL}/submit`;
const QUESTION_WORKSPACE_STORAGE_KEY = 'careerprephub-question-workspaces';
const CURRENT_QUESTION_STORAGE_KEY = 'careerprephub-current-question-index';
const CURRENT_QUESTION_ID_STORAGE_KEY = 'careerprephub-current-question-id';
const CURRENT_QUESTION_SOURCE_ID_STORAGE_KEY = 'careerprephub-current-question-source-id';
const EDITOR_TIMER_STORAGE_KEY = 'careerprephub-editor-timer';
const DEFAULT_EDITOR_TIMER_SECONDS = 30 * 60;

// ── Source ID bounds (must match backend validation) ──────────────────────────
const SOURCE_ID_MIN = 358;
const SOURCE_ID_MAX = 447;


function buildMissingRouteMessage(routePath, actionLabel) {
  return `${actionLabel} API is not available on the backend. Expected route: ${routePath}. Please create the endpoint or update the frontend route mapping.`;
}

function loadQuestionWorkspaceState() {
  try {
    return JSON.parse(localStorage.getItem(QUESTION_WORKSPACE_STORAGE_KEY) || '{}');
  } catch (error) {
    console.error('Failed to parse saved question workspace state:', error);
    return {};
  }
}

function persistQuestionWorkspaceState() {
  try {
    localStorage.setItem(QUESTION_WORKSPACE_STORAGE_KEY, JSON.stringify(questionWorkspaceState));
  } catch (error) {
    console.error('Failed to persist question workspace state:', error);
  }
}

function getQuestionState(questionId) {
  if (!questionId) return null;
  return questionWorkspaceState[questionId] || null;
}

function getDefaultTemplate(language) {
  return (languageConfig[language] || languageConfig.python).template;
}

function saveQuestionState(questionId, updates = {}) {
  if (!questionId) return;

  questionWorkspaceState[questionId] = {
    ...(questionWorkspaceState[questionId] || {}),
    ...updates,
    updatedAt: Date.now(),
  };

  persistQuestionWorkspaceState();
}

function getCurrentQuestionId() {
  return selectedQuestion?._id || null;
}

function getCurrentTerminalSnapshot() {
  return {
    status: submissionStatus.textContent || 'Idle',
    runtime: submissionRuntime.textContent || '--',
    memory: submissionMemory.textContent || '--',
    input: customInputEditor?.value || runInput.textContent || '--',
    expected: expectedOutput.textContent || '--',
    output: userOutput.textContent || '--',
    result: executionResult.textContent || 'Run or submit code to view results.',
    console: consoleOutput.textContent || 'Console output will appear here.',
    activeTab: terminalTabs.find((tab) => tab.classList.contains('active'))?.dataset.tab || 'test-result',
  };
}

function saveCurrentQuestionWorkspace(extraUpdates = {}) {
  const questionId = getCurrentQuestionId();
  if (!questionId) return;

  saveQuestionState(questionId, {
    language: getSelectedLanguage(),
    code: getEditorCode(),
    customInput: getRunInputValue(),
    lastRunOutput: userOutput.textContent || '--',
    terminal: getCurrentTerminalSnapshot(),
    ...extraUpdates,
  });
}

function resetTerminalForQuestion(question) {
  const sample = getSampleIO(question);

  setExecutionState({
    status: 'Ready',
    input: sample.input,
    expected: sample.output,
    output: '--',
    result: 'Fresh workspace loaded for this question. Click Run Code to execute.',
    console: 'Terminal cleared for this question.',
    tone: 'ready',
  });
  setTerminalTab('test-result');
}

function restoreQuestionWorkspace(question) {
  if (!question) return;

  const sample = getSampleIO(question);
  const savedState = getQuestionState(question._id);
  const savedLanguage = savedState?.language && languageConfig[savedState.language]
    ? savedState.language
    : 'python';
  const savedCode = savedState?.code || getDefaultTemplate(savedLanguage);
  const savedInput = savedState?.customInput || sample.input;
  const terminalState = savedState?.terminal || null;

  languageSelect.value = savedLanguage;

  if (!monacoEditor) {
    pendingWorkspaceRestore = { savedLanguage, savedCode };
  } else {
    isApplyingQuestionState = true;
    monaco.editor.setModelLanguage(monacoEditor.getModel(), (languageConfig[savedLanguage] || languageConfig.python).monaco);
    monacoEditor.setValue(savedCode);
    isApplyingQuestionState = false;
  }

  if (customInputEditor) {
    customInputEditor.value = savedInput;
  }

  if (terminalState) {
    setExecutionState({
      status: terminalState.status || 'Ready',
      runtime: terminalState.runtime || '--',
      memory: terminalState.memory || '--',
      input: terminalState.input || savedInput,
      expected: terminalState.expected || sample.output,
      output: terminalState.output || '--',
      result: terminalState.result || 'Workspace restored.',
      console: terminalState.console || 'Console output will appear here.',
      tone: (terminalState.status || '').toLowerCase().includes('error') ? 'error' : 'ready',
    });
    setTerminalTab(terminalState.activeTab || 'test-result');
  } else {
    resetTerminalForQuestion(question);
  }

  saveQuestionState(question._id, {
    language: savedLanguage,
    code: savedCode,
    customInput: savedInput,
    lastRunOutput: savedState?.lastRunOutput || '--',
    terminal: terminalState || getCurrentTerminalSnapshot(),
  });
}

let allQuestions = [];
let activeRequestId = 0;
let selectedQuestion = null;
let currentQuestionIndex = -1;
let monacoEditor = null;
let questionWorkspaceState = loadQuestionWorkspaceState();
let isApplyingQuestionState = false;
let editorSaveTimeout = null;
let pendingWorkspaceRestore = null;
let timerIntervalId = null;
let hasShownTimeUpModal = false;
let hasInitializedTimerFromQuestionLoad = false;
let isEditorLockedByTimer = false;
let languageSelectorController = null;
const editorTimerState = {
  totalDuration: DEFAULT_EDITOR_TIMER_SECONDS,
  remainingTime: DEFAULT_EDITOR_TIMER_SECONDS,
  isRunning: false,
  updatedAt: Date.now(),
};

function createLanguageSelectorController(selectElement, onLanguageChange) {
  function bind() {
    if (!selectElement) return;
    selectElement.addEventListener('change', (event) => {
      onLanguageChange(event.target.value);
    });
  }

  function setDisabled(disabled) {
    if (!selectElement) return;
    selectElement.disabled = Boolean(disabled);
  }

  return {
    bind,
    setDisabled,
  };
}

function formatTimerDisplay(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getTimerToneClass() {
  if (editorTimerState.remainingTime <= 60) return 'timer-state-danger';
  if (editorTimerState.remainingTime <= 5 * 60) return 'timer-state-warning';
  return 'timer-state-normal';
}

function openTimerSetupModal() {
  if (!timerSetupModal) return;
  timerSetupModal.classList.add('active');
  timerSetupModal.setAttribute('aria-hidden', 'false');
  if (timerMinutesInput) {
    timerMinutesInput.focus();
    timerMinutesInput.select();
  }
}

function closeTimerSetupModal() {
  if (!timerSetupModal) return;
  timerSetupModal.classList.remove('active');
  timerSetupModal.setAttribute('aria-hidden', 'true');
}

function closeTimeUpModal() {
  if (!timeUpModal) return;
  timeUpModal.classList.remove('active');
  timeUpModal.setAttribute('aria-hidden', 'true');
}

function openTimeUpModal() {
  if (!timeUpModal || hasShownTimeUpModal) return;
  hasShownTimeUpModal = true;
  timeUpModal.classList.add('active');
  timeUpModal.setAttribute('aria-hidden', 'false');
}

function persistEditorTimerState() {
  try {
    localStorage.setItem(EDITOR_TIMER_STORAGE_KEY, JSON.stringify({
      totalDuration: editorTimerState.totalDuration,
      remainingTime: editorTimerState.remainingTime,
      isRunning: editorTimerState.isRunning,
      updatedAt: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to persist editor timer state:', error);
  }
}

function loadEditorTimerState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(EDITOR_TIMER_STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return;

    const parsedTotalDuration = Number(parsed.totalDuration);
    const parsedRemaining = Number(parsed.remainingTime);
    const parsedRunning = Boolean(parsed.isRunning);
    const parsedUpdatedAt = Number(parsed.updatedAt || Date.now());

    if (!Number.isFinite(parsedRemaining)) return;

    editorTimerState.totalDuration = Number.isFinite(parsedTotalDuration)
      ? Math.max(60, Math.floor(parsedTotalDuration))
      : DEFAULT_EDITOR_TIMER_SECONDS;

    let adjustedRemaining = Math.max(0, Math.floor(parsedRemaining));
    if (parsedRunning) {
      const elapsed = Math.max(0, Math.floor((Date.now() - parsedUpdatedAt) / 1000));
      adjustedRemaining = Math.max(0, adjustedRemaining - elapsed);
    }

    editorTimerState.remainingTime = adjustedRemaining;
    editorTimerState.isRunning = parsedRunning && adjustedRemaining > 0;
    editorTimerState.updatedAt = Date.now();
  } catch (error) {
    console.error('Failed to load editor timer state:', error);
  }
}

function refreshTimerUI() {
  if (!timerLauncherBtn) return;

  timerLauncherBtn.classList.remove('timer-state-normal', 'timer-state-warning', 'timer-state-danger', 'timer-running');

  const shouldShowTimer = editorTimerState.isRunning || editorTimerState.remainingTime < editorTimerState.totalDuration;
  if (shouldShowTimer) {
    timerLauncherBtn.innerHTML = `⏱ ${formatTimerDisplay(editorTimerState.remainingTime)}`;
    timerLauncherBtn.classList.add('timer-running', getTimerToneClass());
  } else {
    timerLauncherBtn.innerHTML = '<i class="fa-solid fa-stopwatch" aria-hidden="true"></i>';
  }

  if (timerStartBtn) {
    timerStartBtn.textContent = editorTimerState.isRunning ? 'Running...' : 'Start';
    timerStartBtn.disabled = editorTimerState.isRunning || isEditorLockedByTimer;
  }

  if (timerStopBtn) {
    timerStopBtn.disabled = !editorTimerState.isRunning;
  }
}

function clearTimerInterval() {
  if (timerIntervalId) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function setEditorLockedStateByTimer(locked) {
  isEditorLockedByTimer = Boolean(locked);

  if (runCodeBtn) {
    runCodeBtn.disabled = isEditorLockedByTimer;
  }

  if (languageSelectorController) {
    languageSelectorController.setDisabled(isEditorLockedByTimer);
  }

  if (monacoEditor) {
    monacoEditor.updateOptions({ readOnly: isEditorLockedByTimer });
  }

  refreshTimerUI();
}

function handleTimerExpired() {
  editorTimerState.remainingTime = 0;
  editorTimerState.isRunning = false;
  clearTimerInterval();
  persistEditorTimerState();
  refreshTimerUI();
  setEditorLockedStateByTimer(true);
  openTimeUpModal();
}

function startTimerInterval() {
  clearTimerInterval();

  if (!editorTimerState.isRunning || editorTimerState.remainingTime <= 0) {
    refreshTimerUI();
    return;
  }

  timerIntervalId = window.setInterval(() => {
    if (!editorTimerState.isRunning) return;

    editorTimerState.remainingTime = Math.max(0, editorTimerState.remainingTime - 1);
    editorTimerState.updatedAt = Date.now();
    refreshTimerUI();
    persistEditorTimerState();

    if (editorTimerState.remainingTime <= 0) {
      handleTimerExpired();
    }
  }, 1000);
}

function setTimerRunning(isRunning, nextDurationSeconds = null) {
  if (editorTimerState.remainingTime <= 0) {
    handleTimerExpired();
    return;
  }

  if (Number.isFinite(nextDurationSeconds) && nextDurationSeconds > 0) {
    const safeDuration = Math.max(60, Math.floor(nextDurationSeconds));
    editorTimerState.totalDuration = safeDuration;
    editorTimerState.remainingTime = safeDuration;
    hasShownTimeUpModal = false;
    closeTimeUpModal();
    setEditorLockedStateByTimer(false);
  }

  editorTimerState.isRunning = Boolean(isRunning);
  editorTimerState.updatedAt = Date.now();
  persistEditorTimerState();
  refreshTimerUI();

  if (editorTimerState.isRunning) {
    startTimerInterval();
  } else {
    clearTimerInterval();
  }
}

function initializeEditorTimerOnQuestionLoad() {
  if (hasInitializedTimerFromQuestionLoad) return;

  hasInitializedTimerFromQuestionLoad = true;
  loadEditorTimerState();
  refreshTimerUI();

  if (editorTimerState.remainingTime <= 0) {
    handleTimerExpired();
    return;
  }

  setEditorLockedStateByTimer(false);
  if (editorTimerState.isRunning) {
    startTimerInterval();
  }
}

function wireTimerControls() {
  timerLauncherBtn?.addEventListener('click', () => {
    if (timerMinutesInput) {
      const currentMinutes = Math.max(1, Math.ceil(editorTimerState.remainingTime / 60));
      timerMinutesInput.value = String(currentMinutes);
    }
    openTimerSetupModal();
  });

  timerStartBtn?.addEventListener('click', () => {
    const typedMinutes = Number(timerMinutesInput?.value);
    const hasCustomDuration = Number.isFinite(typedMinutes) && typedMinutes > 0;
    const nextDurationSeconds = hasCustomDuration
      ? Math.max(1, Math.floor(typedMinutes)) * 60
      : (editorTimerState.remainingTime > 0 ? editorTimerState.remainingTime : DEFAULT_EDITOR_TIMER_SECONDS);

    setTimerRunning(true, nextDurationSeconds);
    closeTimerSetupModal();
  });

  timerStopBtn?.addEventListener('click', () => {
    if (!editorTimerState.isRunning) return;
    setTimerRunning(false);
  });

  timeUpCloseBtn?.addEventListener('click', closeTimeUpModal);
  timeUpSubmitBtn?.addEventListener('click', () => {
    closeTimeUpModal();
    executeSubmitRequest();
  });

  timeUpRetryBtn?.addEventListener('click', () => {
    closeTimeUpModal();
    setEditorLockedStateByTimer(false);
    if (timerMinutesInput) {
      timerMinutesInput.value = String(Math.max(1, Math.ceil(DEFAULT_EDITOR_TIMER_SECONDS / 60)));
    }
    editorTimerState.totalDuration = DEFAULT_EDITOR_TIMER_SECONDS;
    editorTimerState.remainingTime = DEFAULT_EDITOR_TIMER_SECONDS;
    editorTimerState.isRunning = false;
    persistEditorTimerState();
    refreshTimerUI();
    openTimerSetupModal();
  });

  timerSetupModal?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeTimerSetup === 'true') {
      closeTimerSetupModal();
    }
  });

  timeUpModal?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeTimeUp === 'true') {
      closeTimeUpModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && timerSetupModal?.classList.contains('active')) {
      closeTimerSetupModal();
    }
    if (event.key === 'Escape' && timeUpModal?.classList.contains('active')) {
      closeTimeUpModal();
    }
  });
}

function getQuestionSourceLabel(question, index = currentQuestionIndex, total = getVisibleQuestions().length) {
  if (!question || index < 0 || !total) return 'Source ID: --';
  return `Source ID: ${index + 1} / ${total}`;
}

function updateNextAfterSubmitVisibility(show = false) {
  if (!nextAfterSubmitBtn) return;
  nextAfterSubmitBtn.classList.toggle('hidden', !show);
  nextAfterSubmitBtn.disabled = !show || currentQuestionIndex < 0 || currentQuestionIndex >= getVisibleQuestions().length - 1;
}

const languageConfig = {
  python: {
    label: 'Python',
    monaco: 'python',
    template: `def solve():
    # Write your solution here
    return None


if __name__ == "__main__":
    solve()
`,
  },
  java: {
    label: 'Java',
    monaco: 'java',
    template: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        // Write your solution here
    }
}
`,
  },
  c: {
    label: 'C',
    monaco: 'c',
    template: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`,
  },
  cpp: {
    label: 'C++',
    monaco: 'cpp',
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Write your solution here
    return 0;
}
`,
  },
  javascript: {
    label: 'JavaScript',
    monaco: 'javascript',
    template: `function solve(input) {
  // Write your solution here
  return '';
}

console.log(solve(''));
`,
  },
};

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function isPremiumUser() {
  const user = getCurrentUser();
  return Boolean(user && (user.isPaid || user.isPremium));
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function badgeClass(difficulty) {
  const normalized = normalizeText(difficulty);
  if (normalized === 'easy') return 'easy';
  if (normalized === 'medium') return 'medium';
  return 'hard';
}

function formatDifficultyLabel(difficulty) {
  const normalized = normalizeText(difficulty);
  if (!normalized) return 'Unknown';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getSampleIO(question) {
  const firstTestCase = Array.isArray(question.testCases) && question.testCases.length
    ? question.testCases[0]
    : null;

  return {
    input: question.sampleInput || firstTestCase?.input || 'Sample input not provided.',
    output: question.sampleOutput || firstTestCase?.output || 'Sample output not provided.',
  };
}

function getHints(question) {
  return Array.isArray(question.hints) ? question.hints : [];
}

function openPremiumModal() {
  if (!premiumModal) return;

  if (isPremiumUser() && payNowBtn) {
    payNowBtn.disabled = true;
    payNowBtn.textContent = 'You are already Premium';
  } else if (payNowBtn) {
    payNowBtn.disabled = false;
    payNowBtn.textContent = 'Pay Now';
  }

  premiumModal.classList.add('active');
  premiumModal.setAttribute('aria-hidden', 'false');
}

function closePremiumModal() {
  if (!premiumModal) return;
  premiumModal.classList.remove('active');
  premiumModal.setAttribute('aria-hidden', 'true');
}

function wirePremiumModalEvents() {
  if (premiumCloseBtn) {
    premiumCloseBtn.addEventListener('click', closePremiumModal);
  }

  if (premiumModal) {
    premiumModal.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.dataset.closePremium === 'true') {
        closePremiumModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && premiumModal?.classList.contains('active')) {
      closePremiumModal();
    }
  });

  if (payNowBtn) {
    payNowBtn.addEventListener('click', async () => {
      if (payNowBtn.disabled) return;

      const token = localStorage.getItem('authToken');
      if (!token) {
        payNowBtn.textContent = 'Login required';
        setTimeout(() => {
          payNowBtn.textContent = 'Pay Now';
        }, 1500);
        window.location.href = 'login.html?next=coding-questions.html';
        return;
      }

      const originalText = payNowBtn.textContent;
      payNowBtn.disabled = true;
      payNowBtn.textContent = 'Processing...';

      try {
        const response = await fetch(`${API_BASE_URL}/user/upgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || 'Unable to complete upgrade right now.');
        }

        const payload = result?.data || {};
        if (payload.token) {
          localStorage.setItem('authToken', payload.token);
        }
        if (payload.user) {
          localStorage.setItem('currentUser', JSON.stringify(payload.user));
        }

        payNowBtn.textContent = 'Upgrade Complete';
        closePremiumModal();
        await applyFilters();
      } catch (error) {
        console.error(error);
        payNowBtn.disabled = false;
        payNowBtn.textContent = error.message || originalText;
        setTimeout(() => {
          payNowBtn.textContent = originalText;
        }, 1800);
      }
    });
  }
}

function populateCompanyFilter(questions) {
  const selected = companyFilter.value || 'all';
  const companies = [...new Set(questions.map((q) => q.company).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

  companyFilter.innerHTML = '<option value="all">All Companies</option>';

  companies.forEach((company) => {
    const option = document.createElement('option');
    option.value = company;
    option.textContent = company;
    companyFilter.appendChild(option);
  });

  if (selected !== 'all' && companies.includes(selected)) {
    companyFilter.value = selected;
  }
}

function populateTopicFilter(questions) {
  const selected = topicFilter.value || 'all';
  const topics = [...new Set(questions.map((q) => q.topic).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

  topicFilter.innerHTML = '<option value="all">All Topics</option>';

  topics.forEach((topic) => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    topicFilter.appendChild(option);
  });

  if (selected !== 'all' && topics.includes(selected)) {
    topicFilter.value = selected;
  }
}

function getVisibleQuestions() {
  return allQuestions;
}

function formatParagraphs(value, fallback = 'Not available.') {
  const text = String(value || '').trim();
  return text || fallback;
}

function setTerminalTab(tabName) {
  terminalTabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  const testPanel = document.getElementById('panelTestResult');
  const outputPanel = document.getElementById('panelOutput');
  const consolePanel = document.getElementById('panelConsole');

  if (testPanel && outputPanel && consolePanel) {
    const showTest = tabName === 'test-result';
    const showOutput = tabName === 'output';
    const showConsole = tabName === 'console';
    testPanel.classList.toggle('active', showTest);
    outputPanel.classList.toggle('active', showOutput);
    consolePanel.classList.toggle('active', showConsole);
    testPanel.hidden = !showTest;
    outputPanel.hidden = !showOutput;
    consolePanel.hidden = !showConsole;
  }
}

function loadPersistedQuestionSelection() {
  const rawIndex = localStorage.getItem(CURRENT_QUESTION_STORAGE_KEY);
  const rawQuestionId = localStorage.getItem(CURRENT_QUESTION_ID_STORAGE_KEY);
  const rawSourceId = localStorage.getItem(CURRENT_QUESTION_SOURCE_ID_STORAGE_KEY);
  const parsedIndex = Number.parseInt(rawIndex || '', 10);
  const parsedSourceId = Number.parseInt(rawSourceId || '', 10);

  return {
    index: Number.isInteger(parsedIndex) ? parsedIndex : null,
    questionId: rawQuestionId || null,
    sourceId: Number.isInteger(parsedSourceId) ? parsedSourceId : null,
  };
}

function clearPersistedQuestionSelection() {
  try {
    localStorage.removeItem(CURRENT_QUESTION_STORAGE_KEY);
    localStorage.removeItem(CURRENT_QUESTION_ID_STORAGE_KEY);
    localStorage.removeItem(CURRENT_QUESTION_SOURCE_ID_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear current question selection:', error);
  }
}

function persistCurrentQuestionSelection(index, question = selectedQuestion) {
  try {
    localStorage.setItem(CURRENT_QUESTION_STORAGE_KEY, String(index));
    if (question?._id) {
      localStorage.setItem(CURRENT_QUESTION_ID_STORAGE_KEY, String(question._id));
    } else {
      localStorage.removeItem(CURRENT_QUESTION_ID_STORAGE_KEY);
    }

    if (question?.sourceId != null) {
      localStorage.setItem(CURRENT_QUESTION_SOURCE_ID_STORAGE_KEY, String(question.sourceId));
    } else {
      localStorage.removeItem(CURRENT_QUESTION_SOURCE_ID_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to persist current question selection:', error);
  }
}

function clampQuestionIndex(index, total) {
  if (!Number.isInteger(index) || total <= 0) return 0;
  if (index < 0) return 0;
  if (index >= total) return total - 1;
  return index;
}

function resolvePreferredQuestionIndex(questions) {
  if (!Array.isArray(questions) || !questions.length) {
    return 0;
  }

  const persisted = loadPersistedQuestionSelection();
  const total = questions.length;

  if (selectedQuestion?._id) {
    const selectedIndex = questions.findIndex((question) => question._id === selectedQuestion._id);
    if (selectedIndex >= 0) {
      return clampQuestionIndex(selectedIndex, total);
    }
  }

  if (persisted.questionId) {
    const storedQuestionIndex = questions.findIndex((question) => question._id === persisted.questionId);
    if (storedQuestionIndex >= 0) {
      return clampQuestionIndex(storedQuestionIndex, total);
    }

    clearPersistedQuestionSelection();
    return 0;
  }

  if (persisted.index !== null && !Number.isNaN(persisted.index)) {
    return clampQuestionIndex(persisted.index, total);
  }

  return 0;
}

function syncCurrentQuestionSelection(question, index) {
  const safeIndex = clampQuestionIndex(index, getVisibleQuestions().length || 0);
  currentQuestionIndex = safeIndex;
  selectedQuestion = question || null;
  persistCurrentQuestionSelection(safeIndex, question || null);
}

function updateResultSummary({ status = 'Idle', runtime = '--', memory = '--', result = 'Awaiting execution' } = {}) {
  if (summarySubtask) {
    summarySubtask.textContent = currentQuestionIndex >= 0 ? String(currentQuestionIndex + 1) : '--';
  }

  if (summaryResult) {
    summaryResult.textContent = status;
  }

  if (summaryScore) {
    const derivedScore = String(result || '').match(/(\d+\/\d+ passed|100%|\d+%)/i);
    summaryScore.textContent = derivedScore ? derivedScore[0] : (status === 'Accepted' ? '100%' : '--');
  }

  if (summaryFooter) {
    summaryFooter.textContent = runtime !== '--' || memory !== '--'
      ? `${runtime}${memory !== '--' ? ` • ${memory}` : ''}`
      : (result || 'Awaiting execution');
  }
}

function setExecutionState({
  status = 'Idle',
  runtime = '--',
  memory = '--',
  input = '--',
  expected = '--',
  output = '--',
  result = 'Run or submit code to view results.',
  console = 'Console output will appear here.',
  tone = 'idle',
} = {}) {
  submissionStatus.textContent = status;
  submissionRuntime.textContent = runtime;
  submissionMemory.textContent = memory;
  if ('value' in runInput) {
    runInput.value = input;
  } else {
    runInput.textContent = input;
  }
  expectedOutput.textContent = expected;
  userOutput.textContent = output;
  executionResult.textContent = result;
  consoleOutput.textContent = console;
  submissionStatus.className = `status-pill ${tone}`;
  userOutput.className = `terminal-content-box ${tone === 'error' ? 'error-text' : 'success-text'}`;
  consoleOutput.className = `terminal-content-box ${tone === 'error' ? 'error-text' : ''}`;
  updateResultSummary({ status, runtime, memory, result });
}

function getSelectedLanguage() {
  return languageSelect.value || 'python';
}

function getEditorCode() {
  return monacoEditor ? monacoEditor.getValue() : languageConfig[getSelectedLanguage()].template;
}

function getRunInputValue() {
  return customInputEditor?.value || '';
}

function setEditorValueForLanguage(language) {
  if (isEditorLockedByTimer) {
    if (languageSelect) {
      languageSelect.value = getSelectedLanguage();
    }
    return;
  }

  const config = languageConfig[language] || languageConfig.python;
  if (!monacoEditor) {
    pendingWorkspaceRestore = {
      ...(pendingWorkspaceRestore || {}),
      savedLanguage: language,
      savedCode: getDefaultTemplate(language),
    };
    return;
  }

  isApplyingQuestionState = true;
  monaco.editor.setModelLanguage(monacoEditor.getModel(), config.monaco);
  monacoEditor.setValue(config.template);
  isApplyingQuestionState = false;

  saveCurrentQuestionWorkspace({
    language,
    code: config.template,
  });
}

function initializeMonacoEditor() {
  if (monacoEditor) {
    return;
  }

  if (typeof window.require !== 'function') {
    monacoLoaderState.textContent = 'Monaco Editor failed to load. Please refresh the page.';
    return;
  }

  window.require.config({
    paths: {
      vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs',
    },
  });

  window.require(['vs/editor/editor.main'], () => {
    monacoEditor = window.monaco.editor.create(editorContainer, {
      value: languageConfig.python.template,
      language: languageConfig.python.monaco,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: false },
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
      tabSize: 4,
    });

    monacoEditor.onDidChangeModelContent(() => {
      if (isApplyingQuestionState || !selectedQuestion) return;

      clearTimeout(editorSaveTimeout);
      editorSaveTimeout = window.setTimeout(() => {
        saveCurrentQuestionWorkspace({
          code: monacoEditor.getValue(),
          language: getSelectedLanguage(),
        });
      }, 250);
    });

    if (pendingWorkspaceRestore) {
      const pendingLanguage = pendingWorkspaceRestore.savedLanguage || 'python';
      const pendingCode = pendingWorkspaceRestore.savedCode || getDefaultTemplate(pendingLanguage);

      isApplyingQuestionState = true;
      monaco.editor.setModelLanguage(monacoEditor.getModel(), (languageConfig[pendingLanguage] || languageConfig.python).monaco);
      monacoEditor.setValue(pendingCode);
      isApplyingQuestionState = false;
      pendingWorkspaceRestore = null;
    }

    monacoLoaderState.classList.add('hidden');
    editorContainer.classList.add('ready');
    setEditorLockedStateByTimer(isEditorLockedByTimer);
  });
}

async function fetchQuestionDetails(questionId) {
  const response = await fetch(`${API_BASE_URL}/coding/${questionId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to fetch question details.');
  }

  return payload?.data || null;
}

function renderProblemDetails(question) {
  if (!question) return;

  initializeEditorTimerOnQuestionLoad();

  const sample = getSampleIO(question);
  const hints = getHints(question);
  const normalizedDifficulty = normalizeText(question.difficulty);
  const difficultyLabel = normalizedDifficulty
    ? formatDifficultyLabel(normalizedDifficulty)
    : 'Unknown';

  if (selectedQuestion?._id && selectedQuestion._id !== question._id) {
    saveCurrentQuestionWorkspace();
  }

  syncCurrentQuestionSelection(question, currentQuestionIndex);
  activeQuestionStatus.textContent = getQuestionSourceLabel(question, currentQuestionIndex, getVisibleQuestions().length);
  problemTitle.textContent = question.title || 'Untitled Problem';
  problemDifficulty.textContent = difficultyLabel;
  problemDifficulty.className = `difficulty-badge ${badgeClass(normalizedDifficulty)}`;
  problemCompany.textContent = question.company || 'General';
  problemDescription.textContent = formatParagraphs(question.description, 'No description available.');
  problemConstraints.textContent = formatParagraphs(question.constraints, 'No constraints provided.');
  problemSampleInput.textContent = sample.input;
  problemSampleOutput.textContent = sample.output;
  problemExplanation.textContent = formatParagraphs(question.explanation, 'No explanation provided.');

  problemHints.innerHTML = hints.length
    ? hints.map((hint) => `<li>${escapeHTML(hint)}</li>`).join('')
    : '<li>No hints available for this problem.</li>';
  problemHints.classList.add('hidden');
  toggleHintsBtn.textContent = 'Show Hints';

  resetTerminalForQuestion(question);
  restoreQuestionWorkspace(question);
  updateNextAfterSubmitVisibility(false);

  setTerminalTab('test-result');
  updateQuestionNavigation();
}

function updateQuestionNavigation() {
  const total = getVisibleQuestions().length;
  prevQuestionBtn.disabled = currentQuestionIndex <= 0;
  nextQuestionBtn.disabled = currentQuestionIndex < 0 || currentQuestionIndex >= total - 1;
}

function renderEmptyQuestionState(message) {
  resultsMeta.textContent = `${allQuestions.length} question${allQuestions.length !== 1 ? 's' : ''} found`;
  problemTitle.textContent = 'No question available';
  problemDifficulty.textContent = 'Waiting';
  problemDifficulty.className = 'difficulty-badge neutral';
  problemCompany.textContent = 'Company';
  problemDescription.textContent = message;
  problemConstraints.textContent = 'Constraints will appear here.';
  problemSampleInput.textContent = '--';
  problemSampleOutput.textContent = '--';
  problemExplanation.textContent = 'Explanation will appear here when available.';
  problemHints.innerHTML = '<li>No hints available.</li>';
  activeQuestionStatus.textContent = 'Source ID: --';
  currentQuestionIndex = -1;
  selectedQuestion = null;
  clearPersistedQuestionSelection();
  updateNextAfterSubmitVisibility(false);
  updateQuestionNavigation();
}

function buildQueryString() {
  const selectedCompany = companyFilter.value;
  const selectedTopic = topicFilter.value;
  const selectedDifficulty = normalizeText(difficultyFilter.value);
  const params = new URLSearchParams();

  if (selectedCompany && selectedCompany !== 'all') {
    params.set('company', selectedCompany);
  }

  if (selectedTopic && selectedTopic !== 'all') {
    params.set('topic', selectedTopic);
  }

  if (selectedDifficulty && selectedDifficulty !== 'all') {
    params.set('difficulty', selectedDifficulty);
  }

  return params;
}

async function fetchCodingPages(baseParams) {
  let page = 1;
  let totalPages = 1;
  const records = [];

  while (page <= totalPages) {
    const params = new URLSearchParams(baseParams);
    params.set('page', String(page));
    params.set('limit', '100');

    const response = await fetch(`${API_BASE_URL}/coding?${params.toString()}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load coding questions (${response.status})`);
    }

    const payload = await response.json();
    const pageQuestions = Array.isArray(payload?.data) ? payload.data : [];
    records.push(...pageQuestions);

    totalPages = Number(payload?.meta?.pagination?.totalPages || 1);
    page += 1;
  }

  return records;
}

async function applyFilters() {
  const requestId = ++activeRequestId;

  try {
    resultsMeta.textContent = 'Loading questions...';
    const params = buildQueryString();
    const apiQuestions = await fetchCodingPages(params);

    if (requestId !== activeRequestId) return;

    allQuestions = apiQuestions.map((question) => ({
      ...question,
      company: question.company || 'General',
      topic: question.topic || 'General',
      difficulty: normalizeText(question.difficulty),
    }));

    resultsMeta.textContent = `${allQuestions.length} question${allQuestions.length !== 1 ? 's' : ''} found`;

    if (allQuestions.length) {
      const resolvedIndex = clampQuestionIndex(resolvePreferredQuestionIndex(allQuestions), allQuestions.length);
      const preferred = allQuestions[resolvedIndex];

      if (preferred) {
        if (preferred.isLocked) {
          openPremiumModal();
          renderEmptyQuestionState('This filtered question requires premium access. Change filters or upgrade to continue.');
          return;
        }

        currentQuestionIndex = resolvedIndex;
        const fullQuestion = await fetchQuestionDetails(preferred._id);
        renderProblemDetails(fullQuestion);
      }
    } else {
      renderEmptyQuestionState('No questions match the selected filters.');
    }
  } catch (error) {
    console.error(error);
    resultsMeta.textContent = 'Unable to load questions right now.';
    renderEmptyQuestionState('Could not fetch coding questions from API. Please verify backend server and database.');
    setExecutionState({
      status: 'Load Failed',
      result: 'Unable to load coding questions.',
      console: error.message || 'Failed to load coding questions.',
      tone: 'error',
    });
  }
}

async function loadQuestionByIndex(index) {
  const questions = getVisibleQuestions();
  if (!questions.length) return;

  const safeIndex = clampQuestionIndex(index, questions.length);
  if (safeIndex !== index) {
    if (index < 0 || index >= questions.length) {
      updateQuestionNavigation();
    }
  }

  const nextQuestion = questions[safeIndex];
  if (nextQuestion.isLocked) {
    openPremiumModal();
    return;
  }

  // ── Source ID bounds validation ───────────────────────────────────────────
  // Guard against corrupted data; sourceId must be within the valid range.
  // Questions with no sourceId (null/undefined) are allowed through.
  const sid = nextQuestion.sourceId;
  if (sid != null) {
    if (sid > SOURCE_ID_MAX) {
      console.error(`[CareerPrepHub] Question sourceId ${sid} exceeds max ${SOURCE_ID_MAX}. Skipping.`);
      setExecutionState({
        status: 'Data Error',
        result: `Question ID ${sid} is out of range (max: ${SOURCE_ID_MAX}). Contact support.`,
        console: `sourceId overflow detected: ${sid} > ${SOURCE_ID_MAX}`,
        tone: 'error',
      });
      return;
    }
    if (sid < SOURCE_ID_MIN) {
      console.error(`[CareerPrepHub] Question sourceId ${sid} is below min ${SOURCE_ID_MIN}. Skipping.`);
      setExecutionState({
        status: 'Data Error',
        result: `Question ID ${sid} is out of range (min: ${SOURCE_ID_MIN}). Contact support.`,
        console: `sourceId underflow detected: ${sid} < ${SOURCE_ID_MIN}`,
        tone: 'error',
      });
      return;
    }
  }

  syncCurrentQuestionSelection(nextQuestion, safeIndex);
  activeQuestionStatus.textContent = `Source ID: ${safeIndex + 1} / ${questions.length}`;
  updateNextAfterSubmitVisibility(false);

  try {
    const fullQuestion = await fetchQuestionDetails(nextQuestion._id);
    renderProblemDetails(fullQuestion);
  } catch (error) {
    console.error(error);
    setExecutionState({
      status: 'Load Failed',
      result: error.message || 'Unable to load selected problem.',
      console: error.stack || error.message || 'Unable to load problem.',
      tone: 'error',
    });
  }
}

async function executeRunRequest() {
  if (!selectedQuestion) {
    setExecutionState({
      status: 'No Problem',
      result: 'Select a problem before running code.',
      console: 'Run aborted: no active problem selected.',
      tone: 'warning',
    });
    return;
  }

  const sample = getSampleIO(selectedQuestion);

  const payload = {
    code: getEditorCode(),
    language: getSelectedLanguage(),
    input: getRunInputValue() || sample.input,
    problemId: selectedQuestion._id || null,
  };

  setExecutionState({
    status: 'Running...',
    input: sample.input,
    expected: sample.output,
    output: 'Executing sample test cases...',
    result: 'Executing sample test cases only. Hidden tests are not used on Run.',
    console: `${payload.language.toUpperCase()} code dispatched to /run`,
    tone: 'running',
  });
  setTerminalTab('test-result');

  try {
    const response = await fetch(`${API_BASE_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    if (!rawText) {
      throw new Error('No response from server');
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Invalid JSON:', rawText);
      throw new Error('Server returned invalid JSON');
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(buildMissingRouteMessage('/api/run', 'Run Code'));
      }
      throw new Error(data?.message || 'Run failed.');
    }

    const resultBlock = data?.data || data || {};
    
    // Check if status is a failure status
    const isError = ['Runtime Error', 'Compilation Error', 'Time Limit Exceeded', 'System Error'].includes(resultBlock.status);

    const firstTest = (resultBlock.perTestResults && resultBlock.perTestResults.length > 0) ? resultBlock.perTestResults[0] : {};
    const finalStdout = firstTest.stdout || resultBlock.stdout || '--';
    const finalStderr = firstTest.stderr || resultBlock.stderr || resultBlock.compileError || resultBlock.runtimeError || '';

    setExecutionState({
      status: resultBlock.status || (isError ? 'Error' : 'Run Complete'),
      runtime: resultBlock.runtimeMs != null ? `${resultBlock.runtimeMs} ms` : '--',
      memory: resultBlock.memoryMb != null ? `${resultBlock.memoryMb} MB` : '--',
      input: firstTest.input || resultBlock.customInput || payload.input || sample.input,
      expected: sample.output,
      output: finalStdout,
      result: resultBlock.status === 'Accepted' ? 'Sample execution completed successfully.' : (resultBlock.status || 'Execution failed.'),
      console: finalStderr || finalStdout || 'Run completed without console errors.',
      tone: isError ? 'error' : (resultBlock.status === 'Wrong Answer' ? 'warning' : 'success'),
    });
    
    saveCurrentQuestionWorkspace({
      lastRunOutput: finalStdout,
      terminal: getCurrentTerminalSnapshot(),
    });
    setTerminalTab(isError ? 'console' : 'test-result');
  } catch (error) {
    console.error(error);
    setExecutionState({
      status: 'Error',
      input: sample.input,
      expected: sample.output,
      output: 'No output',
      result: error.message || 'Unable to run code against sample test cases.',
      console: error.message || 'Run request failed.',
      tone: 'error',
    });
    saveCurrentQuestionWorkspace({
      terminal: getCurrentTerminalSnapshot(),
    });
    setTerminalTab('console');
  }
}

async function executeSubmitRequest() {
  if (!selectedQuestion) {
    setExecutionState({
      status: 'No Problem',
      result: 'Select a problem before submitting code.',
      console: 'Submit aborted: no active problem selected.',
      tone: 'warning',
    });
    return;
  }

  const payload = {
    code: getEditorCode(),
    language: getSelectedLanguage(),
    problemId: selectedQuestion._id,
  };

  setExecutionState({
    status: 'Submitting...',
    input: 'All test cases (visible + hidden) are executed securely on the backend.',
    expected: 'Protected — hidden test data is never sent to the client.',
    output: 'Protected',
    result: 'Evaluating your solution against all test cases including hidden ones...',
    console: `${payload.language.toUpperCase()} code dispatched to /submit for problem ${payload.problemId}`,
    tone: 'running',
  });
  setTerminalTab('test-result');

  try {
    const response = await fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(buildMissingRouteMessage('/api/submit', 'Submit Code'));
      }
      throw new Error(data?.message || 'Submission failed.');
    }

    const resultBlock = data?.data || data || {};
    const status = resultBlock.status || 'Accepted';
    const isAccepted = status.toLowerCase() === 'accepted';
    
    let inputStr = isAccepted ? 'Hidden test cases executed on server.' : '';
    let expectedStr = isAccepted ? 'Not exposed' : '';
    let outputStr = isAccepted ? 'Not exposed' : '';
    let consoleStr = isAccepted 
      ? `Submission completed. All ${resultBlock.totalTests || ''} hidden test cases passed!`
      : 'Submission failed on hidden test case.';

    if (!isAccepted && resultBlock.failedTestCase) {
      inputStr = resultBlock.failedTestCase.input;
      expectedStr = resultBlock.failedTestCase.expectedOutput;
      outputStr = resultBlock.failedTestCase.actualOutput;
      consoleStr = `Failed at test case ${resultBlock.failedTestCase.index} of ${resultBlock.totalTests}.
${resultBlock.compileError || resultBlock.runtimeError || resultBlock.stderr || ''}`;
    } else if (!isAccepted) {
      // Fallback for compile errors without specific test cases
      consoleStr = resultBlock.compileError || resultBlock.runtimeError || resultBlock.stderr || status;
    }

    setExecutionState({
      status,
      runtime: resultBlock.runtimeMs ? `${resultBlock.runtimeMs} ms` : (resultBlock.runtime || '--'),
      memory: resultBlock.memoryMb ? `${resultBlock.memoryMb} MB` : (resultBlock.memory || '--'),
      input: inputStr,
      expected: expectedStr,
      output: outputStr,
      result: `Final verdict: ${status} ${resultBlock.totalTests ? `(${resultBlock.passedTests || 0}/${resultBlock.totalTests} passed)` : ''}`,
      console: consoleStr,
      tone: isAccepted ? 'success' : 'warning',
    });
    updateNextAfterSubmitVisibility(true);
    saveCurrentQuestionWorkspace({
      terminal: getCurrentTerminalSnapshot(),
    });
  } catch (error) {
    console.error(error);
    setExecutionState({
      status: 'Error',
      input: 'Hidden test cases are unavailable to the client.',
      expected: 'Protected',
      output: 'Protected',
      result: error.message || 'Unable to submit solution.',
      console: error.message || 'Submit request failed.',
      tone: 'error',
    });
    saveCurrentQuestionWorkspace({
      terminal: getCurrentTerminalSnapshot(),
    });
    updateNextAfterSubmitVisibility(false);
    setTerminalTab('console');
  }
}

function bindTerminalTabs() {
  terminalTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setTerminalTab(tab.dataset.tab || 'test-result');
      saveCurrentQuestionWorkspace({
        terminal: getCurrentTerminalSnapshot(),
      });
    });
  });
}

if (customInputEditor) {
  customInputEditor.addEventListener('input', () => {
    saveCurrentQuestionWorkspace({
      customInput: customInputEditor.value,
      terminal: getCurrentTerminalSnapshot(),
    });
  });
}

async function initCodingQuestions() {
  try {
    initializeMonacoEditor();
    const companySeedQuestions = await fetchCodingPages(new URLSearchParams());
    const normalized = companySeedQuestions.map((question) => ({
      ...question,
      company: question.company || 'General',
      topic: question.topic || 'General',
    }));
    populateCompanyFilter(normalized);
    populateTopicFilter(normalized);
    await applyFilters();
  } catch (error) {
    console.error(error);
    resultsMeta.textContent = 'Unable to load questions right now.';
    renderEmptyQuestionState('Could not fetch coding questions from API. Please verify backend server and database.');
    setExecutionState({
      status: 'Load Failed',
      result: 'Unable to initialize coding questions.',
      console: error.message || 'Initialization failed.',
      tone: 'error',
    });
  }
}

companyFilter.addEventListener('change', applyFilters);
topicFilter.addEventListener('change', applyFilters);
difficultyFilter.addEventListener('change', applyFilters);
languageSelectorController = createLanguageSelectorController(languageSelect, setEditorValueForLanguage);
languageSelectorController.bind();
runCodeBtn.addEventListener('click', executeRunRequest);
submitCodeBtn.addEventListener('click', executeSubmitRequest);
nextAfterSubmitBtn?.addEventListener('click', () => loadQuestionByIndex(currentQuestionIndex + 1));
prevQuestionBtn.addEventListener('click', () => loadQuestionByIndex(currentQuestionIndex - 1));
nextQuestionBtn.addEventListener('click', () => loadQuestionByIndex(currentQuestionIndex + 1));
toggleHintsBtn.addEventListener('click', () => {
  problemHints.classList.toggle('hidden');
  toggleHintsBtn.textContent = problemHints.classList.contains('hidden') ? 'Show Hints' : 'Hide Hints';
});

wirePremiumModalEvents();
bindTerminalTabs();
wireTimerControls();
refreshTimerUI();
setExecutionState();
initCodingQuestions();

window.addEventListener('beforeunload', () => {
  persistEditorTimerState();
  clearTimerInterval();
});
