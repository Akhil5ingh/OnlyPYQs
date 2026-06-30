(function () {
  const storageKey = "bpscSciencePracticeProgress.v2";
  const themeKey = "bpscSciencePracticeTheme.v1";
  const questionBank = Array.isArray(window.BPSC_QUIZ_QUESTIONS)
    ? window.BPSC_QUIZ_QUESTIONS
    : Array.isArray(window.BPSC_PHYSICS_QUESTIONS)
      ? window.BPSC_PHYSICS_QUESTIONS
      : [];
  const customQuestionBank = Array.isArray(window.BPSC_CUSTOM_QUESTIONS)
    ? window.BPSC_CUSTOM_QUESTIONS
    : [];
  const letters = ["A", "B", "C", "D", "E"];
  const noSeriesLabel = "No test series";

  const els = {
    subjectSelect: document.getElementById("subjectSelect"),
    topicSelect: document.getElementById("topicSelect"),
    yearSelect: document.getElementById("yearSelect"),
    thirdFilterLabel: document.getElementById("thirdFilterLabel"),
    modeToggle: document.getElementById("modeToggle"),
    reviewToggle: document.getElementById("reviewToggle"),
    reviewModeNote: document.getElementById("reviewModeNote"),
    themeToggle: document.getElementById("themeToggle"),
    saveStatus: document.getElementById("saveStatus"),
    totalQuestionsTop: document.getElementById("totalQuestionsTop"),
    attemptPercent: document.getElementById("attemptPercent"),
    questionCard: document.getElementById("questionCard"),
    emptyState: document.getElementById("emptyState"),
    questionTitle: document.getElementById("questionTitle"),
    questionMeta: document.getElementById("questionMeta"),
    questionText: document.getElementById("questionText"),
    optionsList: document.getElementById("optionsList"),
    answerPanel: document.getElementById("answerPanel"),
    answerStatus: document.getElementById("answerStatus"),
    answerText: document.getElementById("answerText"),
    explanationText: document.getElementById("explanationText"),
    previousBtn: document.getElementById("previousBtn"),
    saveNextBtn: document.getElementById("saveNextBtn"),
    clearBtn: document.getElementById("clearBtn"),
    deleteQuestionBtn: document.getElementById("deleteQuestionBtn"),
    saveMarkBtn: document.getElementById("saveMarkBtn"),
    markNextBtn: document.getElementById("markNextBtn"),
    questionPalette: document.getElementById("questionPalette"),
    paletteSummary: document.getElementById("paletteSummary"),
    notVisitedCount: document.getElementById("notVisitedCount"),
    notAnsweredCount: document.getElementById("notAnsweredCount"),
    answeredCount: document.getElementById("answeredCount"),
    markedCount: document.getElementById("markedCount"),
    uploadProgress: document.getElementById("uploadProgress"),
    uploadProgressFile: document.getElementById("uploadProgressFile"),
    downloadProgress: document.getElementById("downloadProgress"),
    resetProgress: document.getElementById("resetProgress"),
    resultModal: document.getElementById("resultModal"),
    resultAttempted: document.getElementById("resultAttempted"),
    resultSkipped: document.getElementById("resultSkipped"),
    resultCorrect: document.getElementById("resultCorrect"),
    resultWrong: document.getElementById("resultWrong"),
    resultAccuracy: document.getElementById("resultAccuracy"),
    resultScore: document.getElementById("resultScore"),
    closeResultBtn: document.getElementById("closeResultBtn")
  };

  const state = loadState();

  function defaultState() {
    return {
      subject: "All subjects",
      topic: "All topics",
      year: "All years",
      testSeries: "All series",
      mode: "pyq",
      currentIndex: 0,
      draftAnswer: null,
      reviewMode: false,
      reviewIds: [],
      deletedCustomIds: [],
      exams: {}
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && saved.exams) {
        return {
          ...defaultState(),
          ...saved,
          draftAnswer: null,
          year: saved.year || "All years",
          testSeries: saved.testSeries || "All series",
          mode: saved.mode === "custom" ? "custom" : "pyq",
          reviewMode: Boolean(saved.reviewMode),
          reviewIds: Array.isArray(saved.reviewIds) ? saved.reviewIds : [],
          deletedCustomIds: Array.isArray(saved.deletedCustomIds) ? saved.deletedCustomIds : [],
          exams: saved.exams || {}
        };
      }
    } catch {
      // Ignore malformed local progress and start clean.
    }
    return defaultState();
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
    if (els.saveStatus) {
      els.saveStatus.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
  }

  function questionSubject(question) {
    return question.subject || "Physics";
  }

  function questionTopic(question) {
    return question.topic || "Uncategorized";
  }

  function questionYear(question) {
    if (question.year) return String(question.year);
    const sourceText = `${question.id || ""} ${question.explanation || ""}`;
    const years = sourceText.match(/\b(?:19|20)\d{2}\b/g);
    return years?.length ? years[years.length - 1] : "Unknown year";
  }

  function questionTestSeries(question) {
    return question.testSeries || "Untitled Series";
  }

  function isCustomMode() {
    return state.mode === "custom";
  }

  function visibleQuestionBank() {
    if (!isCustomMode()) return questionBank;
    const deleted = new Set(state.deletedCustomIds || []);
    return customQuestionBank.filter((question) => !deleted.has(question.id));
  }

  function questionId(question, index) {
    return question.id || `q-${index + 1}`;
  }

  function questionSignature(question, index) {
    return [
      questionId(question, index),
      question.question,
      (question.options || []).join("~"),
      question.answer,
      questionTestSeries(question),
      questionYear(question)
    ].join("::");
  }

  function selectionKey() {
    const thirdValue = isCustomMode() ? state.testSeries : state.year;
    return `${state.mode}::${state.subject}::${state.topic}::${thirdValue}`;
  }

  function modePrefix(mode = state.mode) {
    return `${mode}::`;
  }

  function examsForMode(exams, mode = state.mode) {
    return Object.fromEntries(Object.entries(exams || {})
      .filter(([key]) => key.startsWith(modePrefix(mode))));
  }

  function bankForSubjectTopic() {
    return visibleQuestionBank()
      .filter((question) => state.subject === "All subjects" || questionSubject(question) === state.subject)
      .filter((question) => state.topic === "All topics" || questionTopic(question) === state.topic);
  }

  function filteredBank() {
    if (isCustomMode()) {
      if (state.testSeries === noSeriesLabel || state.testSeries === "All series") return [];
      return bankForSubjectTopic().filter((question) => questionTestSeries(question) === state.testSeries);
    }
    return bankForSubjectTopic().filter((question) => state.year === "All years" || questionYear(question) === state.year);
  }

  function normalizeAnswer(answer) {
    const text = String(answer || "").trim().toUpperCase();
    const index = letters.indexOf(text);
    return index >= 0 ? index : null;
  }

  function buildQuestion(question, index) {
    return {
      questionId: questionId(question, index),
      sourceIndex: index,
      subject: questionSubject(question),
      topic: questionTopic(question),
      year: questionYear(question),
      testSeries: questionTestSeries(question),
      text: question.question,
      options: question.options || [],
      correctAnswer: normalizeAnswer(question.answer),
      explanation: question.explanation || "",
      selectedAnswer: null,
      status: "not_visited"
    };
  }

  function currentExam() {
    const key = selectionKey();
    const bank = filteredBank();
    const signature = bank.map(questionSignature).join("|");
    if (!state.exams[key] || state.exams[key].signature !== signature) {
      const previousById = new Map((state.exams[key]?.questions || []).map((question) => [question.questionId, question]));
      const questions = bank.map((question, index) => {
        const next = buildQuestion(question, index);
        const previous = previousById.get(next.questionId);
        if (previous) {
          next.selectedAnswer = previous.selectedAnswer;
          next.status = previous.status;
        }
        return next;
      });
      state.exams[key] = { signature, questions };
      state.currentIndex = 0;
    }
    return state.exams[key];
  }

  function allQuestions() {
    return currentExam().questions;
  }

  function currentQuestions() {
    const questions = allQuestions();
    if (!state.reviewMode) return questions;
    const reviewIds = new Set(state.reviewIds);
    return questions.filter((question) => reviewIds.has(question.questionId));
  }

  function currentQuestion() {
    return currentQuestions()[state.currentIndex];
  }

  function openQuestion(index) {
    const questions = currentQuestions();
    if (!questions.length) {
      saveState();
      render();
      return;
    }
    state.currentIndex = Math.max(0, Math.min(questions.length - 1, index));
    state.draftAnswer = null;
    const question = currentQuestion();
    if (question.status === "not_visited") {
      question.status = "not_answered";
    }
    saveState();
    render();
  }

  function populateSubjects() {
    const subjects = ["All subjects", ...Array.from(new Set([
      ...questionBank.map(questionSubject),
      ...customQuestionBank.map(questionSubject)
    ])).sort()];
    replaceOptions(els.subjectSelect, subjects, state.subject);
    if (!subjects.includes(state.subject)) state.subject = "All subjects";
    els.subjectSelect.value = state.subject;
  }

  function populateTopics() {
    const topics = ["All topics", ...Array.from(new Set(visibleQuestionBank()
      .filter((question) => state.subject === "All subjects" || questionSubject(question) === state.subject)
      .map(questionTopic))).sort()];
    if (!topics.includes(state.topic)) state.topic = "All topics";
    replaceOptions(els.topicSelect, topics, state.topic);
  }

  function populateYears() {
    if (els.thirdFilterLabel) {
      els.thirdFilterLabel.textContent = isCustomMode() ? "Test Series" : "Year";
    }
    els.yearSelect.setAttribute("aria-label", isCustomMode() ? "Test Series" : "Year");
    if (isCustomMode()) {
      const series = Array.from(new Set(bankForSubjectTopic().map(questionTestSeries))).sort();
      const values = series.length ? series : [noSeriesLabel];
      if (!values.includes(state.testSeries)) state.testSeries = values[0];
      replaceOptions(els.yearSelect, values, state.testSeries);
      return;
    }
    const years = ["All years", ...Array.from(new Set(bankForSubjectTopic().map(questionYear))).sort((a, b) => {
      if (a === "Unknown year") return 1;
      if (b === "Unknown year") return -1;
      return Number(b) - Number(a);
    })];
    if (!years.includes(state.year)) state.year = "All years";
    replaceOptions(els.yearSelect, years, state.year);
  }

  function replaceOptions(select, values, selectedValue) {
    select.innerHTML = "";
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
    select.value = selectedValue;
  }

  function statusCounts() {
    return currentQuestions().reduce((counts, question) => {
      const status = question.status === "answered_marked" ? "marked" : question.status;
      counts[status] += 1;
      return counts;
    }, {
      not_visited: 0,
      not_answered: 0,
      answered: 0,
      marked: 0
    });
  }

  function wrongOrSkippedQuestions() {
    return allQuestions().filter((question) => question.status === "marked" || question.status === "not_answered");
  }

  function setReviewMode(enabled) {
    if (!enabled) {
      state.reviewMode = false;
      state.reviewIds = [];
      state.currentIndex = 0;
      state.draftAnswer = null;
      saveState();
      openQuestion(0);
      return;
    }

    const reviewQuestions = wrongOrSkippedQuestions();
    if (!reviewQuestions.length) {
      state.reviewMode = false;
      state.reviewIds = [];
      state.currentIndex = 0;
      state.draftAnswer = null;
      saveState();
      render();
      return;
    }

    state.reviewMode = true;
    state.reviewIds = reviewQuestions.map((question) => question.questionId);
    reviewQuestions.forEach((question) => {
      question.selectedAnswer = null;
      question.status = "not_answered";
    });
    state.currentIndex = 0;
    state.draftAnswer = null;
    saveState();
    openQuestion(0);
  }

  function renderReviewToggle() {
    const available = wrongOrSkippedQuestions().length;
    els.reviewToggle.checked = state.reviewMode;
    els.reviewModeNote.textContent = state.reviewMode
      ? `${currentQuestions().length} wrong/unanswered questions in reattempt mode.`
      : available
        ? `${available} wrong/unanswered questions ready to reattempt.`
        : "Show only questions you got wrong or left unanswered.";
  }

  function renderQuestion() {
    const questions = currentQuestions();
    const hasQuestions = questions.length > 0;
    els.questionCard.hidden = !hasQuestions;
    els.emptyState.hidden = hasQuestions;
    if (els.emptyState) {
      const message = isCustomMode()
        ? "Choose a subject with an available test series."
        : "Choose a different subject, topic, or year.";
      const paragraph = els.emptyState.querySelector("p");
      if (paragraph) paragraph.textContent = message;
    }
    [els.previousBtn, els.saveNextBtn, els.clearBtn, els.deleteQuestionBtn, els.saveMarkBtn, els.markNextBtn].forEach((button) => {
      if (button) button.disabled = !hasQuestions;
    });
    if (els.deleteQuestionBtn) els.deleteQuestionBtn.hidden = true;
    if (!hasQuestions) return;

    const question = currentQuestion();
    const visibleAnswer = state.draftAnswer !== null ? state.draftAnswer : question.selectedAnswer;
    els.questionTitle.textContent = `Question ${question.sourceIndex + 1}`;
    els.questionMeta.textContent = isCustomMode()
      ? `${question.subject} / ${question.topic} / ${question.testSeries}`
      : `${question.subject} / ${question.topic} / ${question.year}`;
    els.questionText.textContent = question.text;
    if (els.deleteQuestionBtn) els.deleteQuestionBtn.hidden = !isCustomMode();
    els.optionsList.innerHTML = "";
    els.answerPanel.hidden = true;
    els.answerPanel.removeAttribute("data-result");

    question.options.forEach((option, index) => {
      const label = document.createElement("label");
      label.className = "radio-option";
      label.innerHTML = `
        <input type="radio" name="answer" value="${index}" ${visibleAnswer === index ? "checked" : ""}>
        <span class="option-prefix">${letters[index] || index + 1}</span>
        <span>${escapeHtml(option)}</span>
      `;
      label.querySelector("input").addEventListener("change", () => {
        answerQuestion(question, index);
      });
      els.optionsList.append(label);
    });

    if (question.selectedAnswer !== null) {
      revealAnswer(question);
    }
  }

  function renderLegend() {
    const questions = currentQuestions();
    const counts = statusCounts();
    const attempted = counts.answered + counts.marked;
    const percent = questions.length ? Math.round((attempted / questions.length) * 100) : 0;
    els.notVisitedCount.textContent = counts.not_visited;
    els.notAnsweredCount.textContent = counts.not_answered;
    els.answeredCount.textContent = counts.answered;
    els.markedCount.textContent = counts.marked;
    if (els.totalQuestionsTop) els.totalQuestionsTop.textContent = questions.length;
    els.attemptPercent.textContent = `${percent}%`;
    els.attemptPercent.parentElement.style.setProperty("--progress", `${percent * 3.6}deg`);
  }

  function renderPalette() {
    const questions = currentQuestions();
    els.paletteSummary.textContent = state.reviewMode
      ? `${questions.length} reattempt`
      : `${questions.length} questions`;
    els.questionPalette.innerHTML = "";
    questions.forEach((question, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `palette-button ${question.status}`;
      button.textContent = String(question.sourceIndex + 1).padStart(2, "0");
      button.setAttribute("aria-label", `Question ${question.sourceIndex + 1}`);
      button.classList.toggle("active", index === state.currentIndex);
      button.addEventListener("click", () => openQuestion(index));
      els.questionPalette.append(button);
    });
    renderLegend();
  }

  function render() {
    if (els.modeToggle) els.modeToggle.textContent = isCustomMode() ? "Custom Mode" : "PYQ Mode";
    document.body.classList.toggle("custom-mode", isCustomMode());
    populateTopics();
    populateYears();
    renderQuestion();
    renderPalette();
    renderReviewToggle();
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function answerQuestion(question, selectedIndex) {
    question.selectedAnswer = selectedIndex;
    state.draftAnswer = null;
    question.status = selectedIndex === question.correctAnswer ? "answered" : "marked";
    saveState();
    render();
  }

  function revealAnswer(question) {
    const correctIndex = question.correctAnswer;
    [...els.optionsList.children].forEach((label, index) => {
      const input = label.querySelector("input");
      input.disabled = true;
      label.classList.toggle("selected-option", index === question.selectedAnswer);
      label.classList.toggle("correct-option", index === correctIndex);
      label.classList.toggle("wrong-option", index === question.selectedAnswer && index !== correctIndex);
    });
    const isCorrect = question.selectedAnswer === correctIndex;
    const answerLabel = correctIndex === null
      ? "Official answer not available"
      : `${letters[correctIndex]}. ${question.options[correctIndex]}`;
    els.answerPanel.dataset.result = isCorrect ? "correct" : "wrong";
    els.answerStatus.textContent = isCorrect ? "Correct" : "Wrong";
    els.answerText.textContent = `Correct Answer: ${answerLabel}`;
    els.explanationText.textContent = question.explanation || "";
    els.explanationText.hidden = !question.explanation;
    els.answerPanel.hidden = false;
  }

  function saveAndNext() {
    const question = currentQuestion();
    if (!question) return;
    if (question.selectedAnswer === null) question.status = "not_answered";
    saveState();
    openQuestion(state.currentIndex + 1);
  }

  function previousQuestion() {
    openQuestion(state.currentIndex - 1);
  }

  function clearAnswer() {
    const question = currentQuestion();
    if (!question) return;
    question.selectedAnswer = null;
    state.draftAnswer = null;
    question.status = "not_answered";
    saveState();
    render();
  }

  function skipAndNext() {
    const question = currentQuestion();
    if (!question) return;
    if (question.selectedAnswer === null) question.status = "not_answered";
    saveState();
    openQuestion(state.currentIndex + 1);
  }

  function deleteCurrentQuestion() {
    if (!isCustomMode()) return;
    const question = currentQuestion();
    if (!question) return;
    if (!confirm("Delete this custom question permanently from this browser?")) return;
    if (!state.deletedCustomIds.includes(question.questionId)) {
      state.deletedCustomIds.push(question.questionId);
    }
    state.reviewMode = false;
    state.reviewIds = [];
    state.draftAnswer = null;
    saveState();
    openQuestion(Math.min(state.currentIndex, Math.max(0, allQuestions().length - 1)));
  }

  function showResult() {
    const questions = currentQuestions();
    const attemptedQuestions = questions.filter((q) => q.selectedAnswer !== null);
    const correct = attemptedQuestions.filter((q) => q.correctAnswer !== null && q.selectedAnswer === q.correctAnswer).length;
    const wrong = attemptedQuestions.length - correct;
    const skipped = questions.length - attemptedQuestions.length;
    const accuracy = attemptedQuestions.length ? Math.round((correct / attemptedQuestions.length) * 100) : 0;
    els.resultAttempted.textContent = attemptedQuestions.length;
    els.resultSkipped.textContent = skipped;
    els.resultCorrect.textContent = correct;
    els.resultWrong.textContent = wrong;
    els.resultAccuracy.textContent = `${accuracy}%`;
    els.resultScore.textContent = `${correct} / ${questions.length}`;
    els.resultModal.hidden = false;
  }

  function downloadProgress() {
    const mode = state.mode;
    const modeState = {
      ...defaultState(),
      subject: state.subject,
      topic: state.topic,
      year: state.year,
      testSeries: state.testSeries,
      mode,
      currentIndex: state.currentIndex,
      draftAnswer: null,
      reviewMode: state.reviewMode,
      reviewIds: state.reviewMode ? state.reviewIds : [],
      deletedCustomIds: mode === "custom" ? state.deletedCustomIds : [],
      exams: examsForMode(state.exams, mode)
    };
    const blob = new Blob([JSON.stringify({
      app: "Only PYQs BPSC Science Practice",
      scope: "mode",
      mode,
      exportedAt: new Date().toISOString(),
      state: modeState
    }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `only-pyqs-bpsc-${mode}-progress.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function normalizeImportedState(imported) {
    const importedState = imported?.state || imported;
    if (!importedState || typeof importedState !== "object" || !importedState.exams) {
      throw new Error("This file does not look like an Only PYQs progress file.");
    }
    return {
      ...defaultState(),
      ...importedState,
      draftAnswer: null,
      subject: importedState.subject || "All subjects",
      topic: importedState.topic || "All topics",
      year: importedState.year || "All years",
      testSeries: importedState.testSeries || "All series",
      mode: importedState.mode === "custom" ? "custom" : "pyq",
      reviewMode: Boolean(importedState.reviewMode),
      reviewIds: Array.isArray(importedState.reviewIds) ? importedState.reviewIds : [],
      deletedCustomIds: Array.isArray(importedState.deletedCustomIds) ? importedState.deletedCustomIds : [],
      currentIndex: Number.isFinite(importedState.currentIndex) ? importedState.currentIndex : 0,
      exams: examsForMode(importedState.exams || {}, importedState.mode === "custom" ? "custom" : "pyq")
    };
  }

  function applyImportedProgress(imported) {
    const importedState = normalizeImportedState(imported);
    const importedMode = importedState.mode;
    if (importedMode !== state.mode) {
      throw new Error(`This is ${importedMode === "custom" ? "Custom" : "PYQ"} Mode progress. Switch to ${importedMode === "custom" ? "Custom" : "PYQ"} Mode before uploading it.`);
    }

    Object.keys(state.exams || {}).forEach((key) => {
      if (key.startsWith(modePrefix(importedMode))) delete state.exams[key];
    });
    Object.assign(state.exams, importedState.exams);

    state.subject = importedState.subject;
    state.topic = importedState.topic;
    state.year = importedState.year;
    state.testSeries = importedState.testSeries;
    state.currentIndex = importedState.currentIndex;
    state.draftAnswer = null;
    state.reviewMode = importedState.reviewMode;
    state.reviewIds = importedState.reviewIds;
    if (importedMode === "custom") {
      state.deletedCustomIds = importedState.deletedCustomIds;
    }
    populateSubjects();
    populateTopics();
    populateYears();
    saveState();
    openQuestion(state.currentIndex);
  }

  function uploadProgressFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        applyImportedProgress(JSON.parse(String(reader.result || "{}")));
      } catch (error) {
        alert(error.message || "Could not upload this progress file.");
      } finally {
        els.uploadProgressFile.value = "";
      }
    });
    reader.addEventListener("error", () => {
      alert("Could not read this progress file.");
      els.uploadProgressFile.value = "";
    });
    reader.readAsText(file);
  }

  function resetExam() {
    if (!confirm("Reset this practice selection?")) return;
    delete state.exams[selectionKey()];
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    saveState();
    openQuestion(0);
  }

  function applyTheme(theme) {
    document.body.classList.toggle("theme-light", theme === "light");
    document.body.classList.toggle("theme-dark", theme !== "light");
    els.themeToggle.textContent = theme === "light" ? "Dark" : "Light";
    localStorage.setItem(themeKey, theme);
  }

  function switchMode() {
    state.mode = isCustomMode() ? "pyq" : "custom";
    state.topic = "All topics";
    state.year = "All years";
    state.testSeries = "All series";
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    populateSubjects();
    populateTopics();
    populateYears();
    openQuestion(0);
  }

  function bindFilterPillOpeners() {
    document.querySelectorAll(".filter-row label").forEach((label) => {
      const select = label.querySelector("select");
      if (!select) return;
      label.addEventListener("click", (event) => {
        if (event.target === select) return;
        select.focus();
        if (typeof select.showPicker === "function") {
          select.showPicker();
        }
      });
    });
  }

  els.subjectSelect.addEventListener("change", () => {
    state.subject = els.subjectSelect.value;
    state.topic = "All topics";
    state.year = "All years";
    state.testSeries = "All series";
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    populateTopics();
    populateYears();
    openQuestion(0);
  });

  els.topicSelect.addEventListener("change", () => {
    state.topic = els.topicSelect.value;
    state.year = "All years";
    state.testSeries = "All series";
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    populateYears();
    openQuestion(0);
  });

  els.yearSelect.addEventListener("change", () => {
    if (isCustomMode()) {
      state.testSeries = els.yearSelect.value;
    } else {
      state.year = els.yearSelect.value;
    }
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    openQuestion(0);
  });

  els.reviewToggle.addEventListener("change", () => {
    setReviewMode(els.reviewToggle.checked);
  });

  els.themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("theme-light") ? "dark" : "light";
    applyTheme(nextTheme);
  });
  if (els.modeToggle) els.modeToggle.addEventListener("click", switchMode);

  els.previousBtn.addEventListener("click", previousQuestion);
  els.saveNextBtn.addEventListener("click", saveAndNext);
  els.clearBtn.addEventListener("click", clearAnswer);
  if (els.deleteQuestionBtn) els.deleteQuestionBtn.addEventListener("click", deleteCurrentQuestion);
  els.saveMarkBtn.addEventListener("click", skipAndNext);
  els.markNextBtn.addEventListener("click", skipAndNext);
  els.uploadProgress.addEventListener("click", () => els.uploadProgressFile.click());
  els.uploadProgressFile.addEventListener("change", () => uploadProgressFile(els.uploadProgressFile.files?.[0]));
  els.downloadProgress.addEventListener("click", downloadProgress);
  els.resetProgress.addEventListener("click", resetExam);
  els.closeResultBtn.addEventListener("click", () => {
    els.resultModal.hidden = true;
  });

  applyTheme(localStorage.getItem(themeKey) || "dark");
  bindFilterPillOpeners();
  populateSubjects();
  populateTopics();
  populateYears();
  openQuestion(state.currentIndex);
})();
