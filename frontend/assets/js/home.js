// Navigation and scrolling functionality
document.addEventListener('DOMContentLoaded', function() {
  const API_BASE_URL = 'http://localhost:5000/api';
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLoginBtn = document.getElementById('navLoginBtn');
  const profileCircle = document.getElementById('profileCircle');
  const profileCard = document.getElementById('profileCard');
  const profileDetails = document.getElementById('profileDetails');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const editProfileModal = document.getElementById('editProfileModal');
  const editProfileForm = document.getElementById('editProfileForm');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  const renderUserProfile = (user) => {
    profileDetails.innerHTML = `
      <p><strong>First Name:</strong> ${user.firstname || '-'}</p>
      <p><strong>Middle Name:</strong> ${user.middlename || '-'}</p>
      <p><strong>Last Name:</strong> ${user.lastname || '-'}</p>
      <p><strong>Email:</strong> ${user.email || '-'}</p>
      <p><strong>Username:</strong> ${user.username || '-'}</p>
      <p><strong>Phone:</strong> ${user.phone || '-'}</p>
      <p><strong>Date of Birth:</strong> ${user.dob || '-'}</p>
      <p><strong>Nationality:</strong> ${user.nationality || '-'}</p>
      <p><strong>Status:</strong> ${user.status || '-'}</p>
    `;
  };

  if (!currentUser) {
    navLoginBtn.classList.remove('hidden');
    profileCircle.classList.add('hidden');
    profileCard.classList.add('hidden');
  } else {
    navLoginBtn.classList.add('hidden');
    profileCircle.classList.remove('hidden');

    const profileInitial =
      ((currentUser.email || '').trim().charAt(0) ||
        (currentUser.username || '').trim().charAt(0) ||
        (currentUser.firstname || '').trim().charAt(0) ||
        'U').toUpperCase();

    profileCircle.textContent = profileInitial;
    renderUserProfile(currentUser);

    profileCircle.addEventListener('click', function (e) {
      e.stopPropagation();
      profileCard.classList.toggle('hidden');
    });

    const openEditModal = () => {
      const latestUser = JSON.parse(localStorage.getItem('currentUser') || 'null') || currentUser;
      editProfileForm.firstname.value = latestUser.firstname || '';
      editProfileForm.middlename.value = latestUser.middlename || '';
      editProfileForm.lastname.value = latestUser.lastname || '';
      editProfileForm.email.value = latestUser.email || '';
      editProfileForm.username.value = latestUser.username || '';
      editProfileForm.phone.value = latestUser.phone || '';
      editProfileForm.dob.value = latestUser.dob || '';
      editProfileForm.nationality.value = latestUser.nationality || '';
      editProfileForm.status.value = latestUser.status || '';

      profileCard.classList.add('hidden');
      editProfileModal.classList.remove('hidden');
    };

    const closeEditModal = () => {
      editProfileModal.classList.add('hidden');
    };

    editProfileBtn.addEventListener('click', function () {
      openEditModal();
    });

    closeModalBtn.addEventListener('click', closeEditModal);
    cancelModalBtn.addEventListener('click', closeEditModal);

    editProfileModal.addEventListener('click', function (e) {
      if (e.target === editProfileModal) {
        closeEditModal();
      }
    });

    editProfileForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const latestUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!latestUser) return;

      const updatedUser = {
        ...latestUser,
        firstname: editProfileForm.firstname.value.trim(),
        middlename: editProfileForm.middlename.value.trim(),
        lastname: editProfileForm.lastname.value.trim(),
        email: editProfileForm.email.value.trim(),
        username: editProfileForm.username.value.trim(),
        phone: editProfileForm.phone.value.trim(),
        dob: editProfileForm.dob.value,
        nationality: editProfileForm.nationality.value.trim(),
        status: editProfileForm.status.value.trim(),
      };

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(
        (u) =>
          ((u.email || '').toLowerCase() === (latestUser.email || '').toLowerCase() && !!latestUser.email) ||
          (u.username && latestUser.username && u.username === latestUser.username)
      );

      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        localStorage.setItem('users', JSON.stringify(users));
      }

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      const refreshedInitial =
        ((updatedUser.email || '').trim().charAt(0) ||
          (updatedUser.username || '').trim().charAt(0) ||
          (updatedUser.firstname || '').trim().charAt(0) ||
          'U').toUpperCase();
      profileCircle.textContent = refreshedInitial;
      renderUserProfile(updatedUser);
      closeEditModal();
      alert('Profile updated successfully');
    });

    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = 'home.html';
    });
  }

  document.addEventListener('click', function (e) {
    if (!profileCard.contains(e.target) && e.target !== profileCircle) {
      profileCard.classList.add('hidden');
    }
  });

  // Mobile menu toggle
  navToggle.addEventListener('click', function() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
  });

  // Close mobile menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
    });
  });

  // Smooth scrolling for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');

      if (!targetId || !targetId.startsWith('#')) {
        return;
      }

      e.preventDefault();
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });

  // Navbar background change on scroll
  function updateNavbar() {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(255, 255, 255, 0.98)';
      navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
      navbar.style.background = 'rgba(255, 255, 255, 0.95)';
      navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
  }

  // Scroll event listeners
  window.addEventListener('scroll', function() {
    updateNavbar();
  });

  // Initialize navbar
  updateNavbar();

  // Hero section animation
  const heroContent = document.querySelector('.hero-content');
  const heroImage = document.querySelector('.hero-image');
  const typingText = document.getElementById('typing-text');
  const codeTyping = document.getElementById('code-typing');
  const codeLines = document.getElementById('code-lines');

  if (heroContent && heroImage) {
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateX(-50px)';
    heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

    heroImage.style.opacity = '0';
    heroImage.style.transform = 'translateX(50px)';
    heroImage.style.transition = 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s';

    setTimeout(() => {
      heroContent.style.opacity = '1';
      heroContent.style.transform = 'translateX(0)';
      heroImage.style.opacity = '1';
      heroImage.style.transform = 'translateX(0)';

      // Start typing animation after hero content appears
      setTimeout(() => {
        startSubtitleTypingAnimation();
        startCodeEditorAnimation();
      }, 800);
    }, 100);
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Subheading typing animation
  function startSubtitleTypingAnimation() {
    if (!typingText) return;

    const subtitleContainer = document.querySelector('.hero-subtitle-container');

    const quotes = [
      'Practice with purpose. Prepare for success.',
      'Build skills that get you hired.',
      'Crack your next tech interview.'
    ];

    // Width is controlled by CSS (--hero-typing-width: 48ch) — stable across all quotes.


    let quoteIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeWriter() {
      const currentQuote = quotes[quoteIndex];
      
      if (!isDeleting) {
        // Typing effect
        typingText.textContent = currentQuote.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentQuote.length) {
          // Pause before deleting
          setTimeout(() => {
            isDeleting = true;
            typeWriter();
          }, 1500);
          return;
        }
      } else {
        // Deleting effect
        typingText.textContent = currentQuote.substring(0, charIndex);
        charIndex--;

        if (charIndex < 0) {
          // Move to next quote
          isDeleting = false;
          quoteIndex = (quoteIndex + 1) % quotes.length;
          charIndex = 0;
          setTimeout(typeWriter, 500);
          return;
        }
      }

      // Adjust typing speed
      const typingSpeed = isDeleting ? 30 : 52;
      setTimeout(typeWriter, typingSpeed);
    }

    typeWriter();
  }

  // Fake live coding editor animation
  function startCodeEditorAnimation() {
    if (!codeTyping || !codeLines) return;

    const codeString = [
      'public class Career {',
      '    public static void main(String[] args) {',
      '        System.out.println("Prepare. Practice. Succeed.");',
      '    }',
      '}'
    ].join('\n');

    const lineCount = codeString.split('\n').length;
    codeLines.innerHTML = Array.from({ length: lineCount }, (_, index) => `<div>${index + 1}</div>`).join('');

    const tokenRules = [
      { type: 'string', regex: /^"[^"\\]*(?:\\.[^"\\]*)*"/ },
      { type: 'keyword', regex: /^(public|class|static|void)\b/ },
      { type: 'class-name', regex: /^Career\b/ },
      { type: 'method', regex: /^(main|println)\b/ },
      { type: 'type', regex: /^String\b/ },
      { type: 'variable', regex: /^args\b/ },
      { type: 'punctuation', regex: /^[.(){}\[\];,]/ }
    ];

    const renderCode = (text) => {
      let remaining = text;
      let html = '';

      while (remaining.length > 0) {
        let matched = false;

        for (const { type, regex } of tokenRules) {
          const match = remaining.match(regex);
          if (match) {
            html += `<span class="code-token ${type}">${escapeHtml(match[0])}</span>`;
            remaining = remaining.slice(match[0].length);
            matched = true;
            break;
          }
        }

        if (!matched) {
          html += escapeHtml(remaining[0]);
          remaining = remaining.slice(1);
        }
      }

      codeTyping.innerHTML = `${html}<span class="code-token cursor">|</span>`;
    };

    let index = 0;
    let deleting = false;

    function tick() {
      const visibleText = deleting
        ? codeString.slice(0, index)
        : codeString.slice(0, index + 1);

      renderCode(visibleText);

      if (!deleting) {
        index += 1;
        if (index >= codeString.length) {
          deleting = true;
          setTimeout(tick, 1800);
          return;
        }
      } else {
        index -= 1;
        if (index <= 0) {
          deleting = false;
          index = 0;
          setTimeout(tick, 550);
          return;
        }
      }

      const delay = deleting ? 18 : codeString[index] === '\n' ? 180 : 42;
      setTimeout(tick, delay);
    }

    tick();
  }

  const stats = document.querySelectorAll('.stat h3');
  const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const targetNumber = parseInt(target.textContent.replace(/[^0-9]/g, ''));
        animateCounter(target, 0, targetNumber, 2000);
        statsObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => {
    statsObserver.observe(stat);
  });

  function animateCounter(element, start, end, duration) {
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const current = Math.floor(start + (end - start) * progress);
      element.textContent = current.toLocaleString() + (element.textContent.includes('+') ? '+' : '');

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }

    requestAnimationFrame(updateCounter);
  }

  // ---------------- Aptitude Section Logic ----------------
  // This powers: data loading, option selection, show-answer confirmation modal,
  // correct/wrong highlighting, topic filter, previous/next navigation, and progress.
  const aptitudeEls = {
    topicFilter: document.getElementById('aptitudeTopicFilter'),
    progress: document.getElementById('aptitudeProgress'),
    questionNumber: document.getElementById('aptitudeQuestionNumber'),
    difficulty: document.getElementById('aptitudeDifficulty'),
    questionText: document.getElementById('aptitudeQuestionText'),
    optionsWrap: document.getElementById('aptitudeOptions'),
    showAnswerBtn: document.getElementById('showAnswerBtn'),
    answerPanel: document.getElementById('answerPanel'),
    correctAnswerText: document.getElementById('correctAnswerText'),
    explanationText: document.getElementById('explanationText'),
    prevBtn: document.getElementById('prevQuestionBtn'),
    nextBtn: document.getElementById('nextQuestionBtn'),
    statusMessage: document.getElementById('aptitudeStatusMessage'),
    modal: document.getElementById('answerConfirmModal'),
    modalYes: document.getElementById('confirmShowAnswerBtn'),
    modalNo: document.getElementById('cancelShowAnswerBtn')
  };

  const aptitudeSectionAvailable = Object.values(aptitudeEls).every(Boolean);

  if (aptitudeSectionAvailable) {
    const aptitudeState = {
      allQuestions: [],
      filteredQuestions: [],
      currentIndex: 0,
      selectedAnswersById: {},
      revealedById: {},
      activeTopic: 'all'
    };

    const getQuestionId = (question) => question.__id;

    const normalizeTopicLabel = (topicKey) =>
      topicKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const getQuestionTopic = (question) =>
      question.topic || question.Topic || question.__topicKey || 'General';

    const setStatus = (message = '') => {
      aptitudeEls.statusMessage.textContent = message;
      aptitudeEls.statusMessage.classList.toggle('hidden', !message);
    };

    const closeAnswerModal = () => {
      aptitudeEls.modal.classList.add('hidden');
    };

    const openAnswerModal = () => {
      aptitudeEls.modal.classList.remove('hidden');
    };

    const updateNavigationControls = () => {
      const total = aptitudeState.filteredQuestions.length;
      aptitudeEls.prevBtn.disabled = aptitudeState.currentIndex <= 0;
      aptitudeEls.nextBtn.disabled = aptitudeState.currentIndex >= total - 1;
    };

    const updateProgress = () => {
      const total = aptitudeState.filteredQuestions.length;
      const current = total ? aptitudeState.currentIndex + 1 : 0;
      aptitudeEls.progress.textContent = `${current} / ${total}`;
    };

    const buildOptionButton = (optionText, optionIndex, question) => {
      const questionId = getQuestionId(question);
      const selectedAnswer = aptitudeState.selectedAnswersById[questionId];
      const isRevealed = !!aptitudeState.revealedById[questionId];
      const isSelected = selectedAnswer === optionText;
      const isCorrect = question.answer === optionText;

      const optionBtn = document.createElement('button');
      optionBtn.type = 'button';
      optionBtn.className = 'option-btn';
      optionBtn.setAttribute('role', 'radio');
      optionBtn.setAttribute('aria-checked', String(isSelected));
      optionBtn.textContent = `${String.fromCharCode(65 + optionIndex)}. ${optionText}`;

      if (isSelected) {
        optionBtn.classList.add('selected');
      }

      // After answer reveal: always highlight correct in green.
      // If selected option is wrong, highlight it in red.
      if (isRevealed) {
        if (isCorrect) optionBtn.classList.add('correct');
        if (isSelected && !isCorrect) optionBtn.classList.add('wrong');
      }

      optionBtn.addEventListener('click', () => {
        aptitudeState.selectedAnswersById[questionId] = optionText;
        renderQuestion();
      });

      return optionBtn;
    };

    const revealAnswerForCurrent = () => {
      const question = aptitudeState.filteredQuestions[aptitudeState.currentIndex];
      if (!question) return;

      const questionId = getQuestionId(question);
      aptitudeState.revealedById[questionId] = true;
      renderQuestion();
      closeAnswerModal();
    };

    const renderQuestion = () => {
      const question = aptitudeState.filteredQuestions[aptitudeState.currentIndex];
      const total = aptitudeState.filteredQuestions.length;

      if (!question || total === 0) {
        aptitudeEls.questionNumber.textContent = 'Q0';
        aptitudeEls.questionText.textContent = 'No questions found for this topic.';
        aptitudeEls.optionsWrap.innerHTML = '';
        aptitudeEls.answerPanel.classList.add('hidden');
        aptitudeEls.showAnswerBtn.disabled = true;
        aptitudeEls.prevBtn.disabled = true;
        aptitudeEls.nextBtn.disabled = true;
        aptitudeEls.difficulty.classList.add('hidden');
        updateProgress();
        return;
      }

      const questionId = getQuestionId(question);
      const isRevealed = !!aptitudeState.revealedById[questionId];
      const topic = getQuestionTopic(question);

      aptitudeEls.questionNumber.textContent = `Q${aptitudeState.currentIndex + 1}`;
      aptitudeEls.questionText.textContent = question.question;

      if (question.difficulty) {
        aptitudeEls.difficulty.textContent = question.difficulty;
        aptitudeEls.difficulty.classList.remove('hidden');
      } else {
        aptitudeEls.difficulty.classList.add('hidden');
      }

      aptitudeEls.optionsWrap.innerHTML = '';
      (question.options || []).forEach((option, optionIndex) => {
        aptitudeEls.optionsWrap.appendChild(buildOptionButton(option, optionIndex, question));
      });

      aptitudeEls.correctAnswerText.textContent = `${question.answer} (${topic})`;
      aptitudeEls.explanationText.textContent = question.explanation || 'No explanation available.';

      aptitudeEls.answerPanel.classList.toggle('hidden', !isRevealed);
      aptitudeEls.answerPanel.classList.toggle('show', isRevealed);

      aptitudeEls.showAnswerBtn.disabled = isRevealed;
      aptitudeEls.showAnswerBtn.textContent = isRevealed ? 'Answer Shown' : 'Show Answer';

      updateNavigationControls();
      updateProgress();
    };

    const applyTopicFilter = () => {
      const topic = aptitudeState.activeTopic;

      aptitudeState.filteredQuestions = topic === 'all'
        ? [...aptitudeState.allQuestions]
        : aptitudeState.allQuestions.filter((question) => question.__topicKey === topic);

      aptitudeState.currentIndex = 0;
      renderQuestion();
    };

    const populateTopicFilter = (topicKeys) => {
      const options = ['<option value="all">All Topics</option>'];
      topicKeys.forEach((topicKey) => {
        options.push(`<option value="${topicKey}">${normalizeTopicLabel(topicKey)}</option>`);
      });
      aptitudeEls.topicFilter.innerHTML = options.join('');
    };

    const loadAptitudeQuestions = async () => {
      try {
        setStatus('');
        const response = await fetch(`${API_BASE_URL}/aptitude`);
        if (!response.ok) {
          throw new Error(`Could not load dataset (HTTP ${response.status})`);
        }

        const data = await response.json();

        aptitudeState.allQuestions = (Array.isArray(data) ? data : []).map((question, index) => {
          const topicKey = (question.topicKey || question.topic || 'general').toLowerCase().replace(/\s+/g, '_');
          return {
            ...question,
            __topicKey: topicKey,
            __id: question._id || `${topicKey}-${index}`
          };
        });

        const topicKeys = [...new Set(aptitudeState.allQuestions.map((question) => question.__topicKey))];

        if (!aptitudeState.allQuestions.length) {
          setStatus('No aptitude questions available in dataset.');
        }

        populateTopicFilter(topicKeys);
        applyTopicFilter();
      } catch (error) {
        setStatus(`Unable to load aptitude questions. ${error.message}`);
      }
    };

    aptitudeEls.topicFilter.addEventListener('change', (event) => {
      aptitudeState.activeTopic = event.target.value;
      applyTopicFilter();
    });

    aptitudeEls.prevBtn.addEventListener('click', () => {
      if (aptitudeState.currentIndex > 0) {
        aptitudeState.currentIndex -= 1;
        renderQuestion();
      }
    });

    aptitudeEls.nextBtn.addEventListener('click', () => {
      if (aptitudeState.currentIndex < aptitudeState.filteredQuestions.length - 1) {
        aptitudeState.currentIndex += 1;
        renderQuestion();
      }
    });

    aptitudeEls.showAnswerBtn.addEventListener('click', () => {
      const question = aptitudeState.filteredQuestions[aptitudeState.currentIndex];
      if (!question) return;

      const questionId = getQuestionId(question);
      if (aptitudeState.revealedById[questionId]) return;
      openAnswerModal();
    });

    aptitudeEls.modalYes.addEventListener('click', revealAnswerForCurrent);
    aptitudeEls.modalNo.addEventListener('click', closeAnswerModal);
    aptitudeEls.modal.addEventListener('click', (event) => {
      if (event.target === aptitudeEls.modal) {
        closeAnswerModal();
      }
    });

    loadAptitudeQuestions();
  }

  // FAQ Accordion
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach((question) => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      const icon = question.querySelector('.faq-icon');
      const isOpen = item.classList.contains('active');

      item.classList.toggle('active', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));
      icon.textContent = isOpen ? '+' : '-';
    });
  });

});
