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
  const allExamsLabel = "All exams";
  const examFilterOptions = [
    allExamsLabel,
    "B.P.S.C. Pre / Re-Exam",
    "B.P.S.C. CDPO Preliminary Exam",
    "B.P.S.C. BAO Exam",
    "B.P.S.C. TRE-3 Exam",
    "B.P.S.C. School Teacher Exam",
    "B.P.S.C. School Teacher/Headmaster Exam",
    "B.P.S.C. Teacher Exam"
  ];
  const subjectMenuBlueprint = [
    { type: "option", label: "All subjects", value: "All subjects" },
    {
      type: "group",
      label: "General Science",
      children: [
        { label: "Physics", value: "Physics" },
        { label: "Chemistry", value: "Chemistry" },
        { label: "Biology", value: "Biology" }
      ]
    },
    {
      type: "group",
      label: "Bihar State",
      children: [
        { label: "Geography", value: "Bihar Geography" },
        { label: "Economics", value: "Bihar Economics" },
        { label: "History", value: "History of Bihar" },
        { label: "Political scenario", value: "Political scenario of Bihar" },
        { label: "Miscellaneous", value: "Bihar Miscellaneous" }
      ]
    },
    {
      type: "group",
      label: "Indian History",
      children: [
        { label: "Ancient History", value: "Ancient History" },
        { label: "Medieval History", value: "Medieval History" },
        { label: "Modern History", value: "Modern History" }
      ]
    },
    { type: "option", label: "Indian Geography", value: "Indian Geography" },
    { type: "option", label: "World Geography", value: "World Geography" },
    { type: "option", label: "Environment and Ecology", value: "Environment and Ecology" }
  ];
  const plannedSubjectValues = subjectMenuBlueprint.flatMap((item) => item.children ? item.children.map((child) => child.value) : [item.value]);
  const subjectDisplayPaths = new Map(subjectMenuBlueprint.flatMap((item) => {
    if (!item.children) return [[item.value, item.label]];
    return item.children.map((child) => [child.value, `${item.label} \u203a ${child.label}`]);
  }));

  const els = {
    examSelect: document.getElementById("examSelect"),
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
      exam: allExamsLabel,
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
          exam: saved.exam || allExamsLabel,
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

  function questionExams(question) {
    if (examFilterOptions.includes(question.exam)) return [question.exam];
    if (Array.isArray(question.exams)) {
      return question.exams.filter((exam) => examFilterOptions.includes(exam));
    }

    const sourceText = [
      question.exam || "",
      question.source || "",
      question.explanation || ""
    ].join(" ");
    const compact = sourceText.toUpperCase().replace(/[^A-Z0-9]+/g, "");
    const exams = [];
    const addExam = (exam) => {
      if (!exams.includes(exam)) exams.push(exam);
    };

    if (compact.includes("CDPO")) addExam("B.P.S.C. CDPO Preliminary Exam");
    if (compact.includes("BAO")) addExam("B.P.S.C. BAO Exam");
    if (compact.includes("TRE3")) addExam("B.P.S.C. TRE-3 Exam");
    if (compact.includes("SCHOOLTEACHERHEADMASTER") || compact.includes("HEADMASTER")) {
      addExam("B.P.S.C. School Teacher/Headmaster Exam");
    }
    if (compact.includes("SCHOOLTEACHER") && !compact.includes("HEADMASTER")) {
      addExam("B.P.S.C. School Teacher Exam");
    }
    if (compact.includes("TEACHER") && !compact.includes("SCHOOLTEACHER") && !compact.includes("HEADMASTER")) {
      addExam("B.P.S.C. Teacher Exam");
    }

    const hasGeneralBpscPre = /\d+(?:st|nd|rd|th)?(?:\s*to\s*\d+(?:st|nd|rd|th)?)?\s*b\.?\s*p\.?\s*s\.?\s*c\.?.{0,60}(?:pre|re\s*-?\s*exam)/i.test(sourceText)
      || /\bb\.?\s*p\.?\s*s\.?\s*c\.?\s*(?:re\s*-?\s*exam|pre\s*-\s*\d{4})/i.test(sourceText);
    if (hasGeneralBpscPre) addExam("B.P.S.C. Pre / Re-Exam");

    return exams;
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
    return `${state.mode}::${state.exam}::${state.subject}::${state.topic}::${thirdValue}`;
  }

  function legacySelectionKey(selectionState = state) {
    const mode = selectionState.mode === "custom" ? "custom" : "pyq";
    const thirdValue = mode === "custom" ? selectionState.testSeries : selectionState.year;
    return `${mode}::${selectionState.subject}::${selectionState.topic}::${thirdValue}`;
  }

  function selectionKeyFromState(selectionState) {
    const mode = selectionState.mode === "custom" ? "custom" : "pyq";
    const thirdValue = mode === "custom" ? selectionState.testSeries : selectionState.year;
    const exam = selectionState.exam || allExamsLabel;
    return `${mode}::${exam}::${selectionState.subject}::${selectionState.topic}::${thirdValue}`;
  }

  function examForSelection(exams, key = selectionKey()) {
    return exams?.[key] ? { [key]: exams[key] } : {};
  }

  function customQuestionMatchesSelection(question, selectionState) {
    if (questionSubject(question) !== selectionState.subject && selectionState.subject !== "All subjects") return false;
    if (questionTopic(question) !== selectionState.topic && selectionState.topic !== "All topics") return false;
    return questionTestSeries(question) === selectionState.testSeries;
  }

  function deletedIdsForSelection(selectionState = state) {
    if (selectionState.mode !== "custom") return [];
    const deleted = new Set(selectionState.deletedCustomIds || []);
    return customQuestionBank
      .filter((question) => deleted.has(question.id))
      .filter((question) => customQuestionMatchesSelection(question, selectionState))
      .map((question) => question.id);
  }

  function withoutSelectionDeletedIds(selectionState = state) {
    if (selectionState.mode !== "custom") return state.deletedCustomIds || [];
    const selectionIds = new Set(customQuestionBank
      .filter((question) => customQuestionMatchesSelection(question, selectionState))
      .map((question) => question.id));
    return (state.deletedCustomIds || []).filter((id) => !selectionIds.has(id));
  }

  function filePart(value) {
    return String(value || "all")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "all";
  }

  function bankForSubjectTopic() {
    return visibleQuestionBank()
      .filter((question) => state.exam === allExamsLabel || questionExams(question).includes(state.exam))
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
      exam: questionExams(question).join(", ") || "Exam not tagged",
      year: questionYear(question),
      testSeries: questionTestSeries(question),
      text: question.question || question.prompt || "",
      options: question.options || [],
      correctAnswer: normalizeAnswer(question.answer),
      explanation: question.explanation || "",
      selectedAnswer: null,
      status: "not_visited"
    };
  }

  function currentExam() {
    const key = selectionKey();
    const oldKey = legacySelectionKey();
    if (!state.exams[key] && state.exam === allExamsLabel && state.exams[oldKey]) {
      state.exams[key] = state.exams[oldKey];
    }
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
    const discoveredSubjects = Array.from(new Set([
      ...questionBank.map(questionSubject),
      ...customQuestionBank.map(questionSubject)
    ])).sort();
    const extraSubjects = discoveredSubjects.filter((subject) => !plannedSubjectValues.includes(subject));
    const subjects = [...plannedSubjectValues, ...extraSubjects];
    replaceOptions(els.subjectSelect, subjects, state.subject);
    if (!subjects.includes(state.subject)) state.subject = "All subjects";
    els.subjectSelect.value = state.subject;
    renderCustomDropdown("subject");
  }

  function populateExams() {
    if (!examFilterOptions.includes(state.exam)) state.exam = allExamsLabel;
    replaceOptions(els.examSelect, examFilterOptions, state.exam);
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
    renderCustomDropdown(select.id === "examSelect" ? "exam" : select.id === "topicSelect" ? "topic" : select.id === "yearSelect" ? "year" : "subject");
  }

  function dropdownForType(type) {
    return document.getElementById(`${type}Dropdown`);
  }

  function selectForType(type) {
    if (type === "exam") return els.examSelect;
    if (type === "subject") return els.subjectSelect;
    if (type === "topic") return els.topicSelect;
    return els.yearSelect;
  }

  function displayValue(type, value) {
    if (type === "subject") return subjectDisplayPaths.get(value) || value;
    return value;
  }

  function selectedValueForType(type) {
    if (type === "exam") return state.exam;
    if (type === "subject") return state.subject;
    if (type === "topic") return state.topic;
    return isCustomMode() ? state.testSeries : state.year;
  }

  function optionValues(select) {
    return Array.from(select.options).map((option) => option.value);
  }

  function makeDropdownItem(label, value, selectedValue, className = "") {
    const item = document.createElement("li");
    item.className = `dropdown-item${className ? ` ${className}` : ""}`;
    item.dataset.value = value;
    item.setAttribute("role", "menuitem");

    const text = document.createElement("span");
    text.textContent = label;
    item.append(text);
    item.classList.toggle("is-active", value === selectedValue);
    return item;
  }

  function makeChevron() {
    const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevron.setAttribute("class", "chevron-icon");
    chevron.setAttribute("width", "14");
    chevron.setAttribute("height", "14");
    chevron.setAttribute("viewBox", "0 0 24 24");
    chevron.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z");
    chevron.append(path);
    return chevron;
  }

  function renderSubjectDropdown(list, selectedValue) {
    const availableValues = new Set(optionValues(els.subjectSelect));
    const plannedValues = new Set(plannedSubjectValues);

    subjectMenuBlueprint.forEach((entry) => {
      if (!entry.children) {
        if (availableValues.has(entry.value)) {
          list.append(makeDropdownItem(entry.label, entry.value, selectedValue));
        }
        return;
      }

      const visibleChildren = entry.children.filter((child) => availableValues.has(child.value));
      if (!visibleChildren.length) return;

      const parent = document.createElement("li");
      parent.className = "dropdown-item has-submenu";
      parent.setAttribute("role", "presentation");
      const parentText = document.createElement("span");
      parentText.textContent = entry.label;
      parent.append(parentText, makeChevron());
      parent.classList.toggle("is-active", visibleChildren.some((child) => child.value === selectedValue));

      const submenu = document.createElement("ul");
      submenu.className = "dropdown-submenu";
      visibleChildren.forEach((child) => {
        submenu.append(makeDropdownItem(child.label, child.value, selectedValue, "sub-item"));
      });
      parent.append(submenu);
      list.append(parent);
    });

    optionValues(els.subjectSelect)
      .filter((value) => !plannedValues.has(value))
      .sort()
      .forEach((value) => list.append(makeDropdownItem(value, value, selectedValue)));
  }

  function renderStandardDropdown(type, list, selectedValue) {
    optionValues(selectForType(type)).forEach((value) => {
      list.append(makeDropdownItem(value, value, selectedValue));
    });
  }

  function renderCustomDropdown(type) {
    const dropdown = dropdownForType(type);
    const select = selectForType(type);
    if (!dropdown || !select) return;

    const selectedValue = selectedValueForType(type);
    const triggerText = dropdown.querySelector(".trigger-text");
    const list = dropdown.querySelector(".dropdown-options");
    const search = dropdown.querySelector(".dropdown-search");
    if (triggerText) triggerText.textContent = displayValue(type, selectedValue);
    if (!list) return;

    list.innerHTML = "";
    if (type === "subject") {
      renderSubjectDropdown(list, selectedValue);
    } else {
      renderStandardDropdown(type, list, selectedValue);
    }
    if (search) search.value = "";
    filterDropdownOptions(dropdown, "");
  }

  function fuzzyMatch(text, query) {
    const haystack = text.toLowerCase();
    const needle = query.toLowerCase().trim();
    if (!needle || haystack.includes(needle)) return true;
    let position = 0;
    for (const character of needle) {
      position = haystack.indexOf(character, position);
      if (position === -1) return false;
      position += 1;
    }
    return true;
  }

  function filterDropdownOptions(dropdown, query) {
    const term = query.trim();
    if (!term) resetSubmenus(dropdown);
    dropdown.querySelectorAll(".dropdown-options > .dropdown-item").forEach((item) => {
      if (item.classList.contains("has-submenu")) {
        const parentLabel = item.querySelector(":scope > span")?.textContent || "";
        const parentMatches = fuzzyMatch(parentLabel, term);
        let childMatches = false;
        item.querySelectorAll(".dropdown-submenu .dropdown-item").forEach((child) => {
          const label = child.textContent || "";
          const matches = parentMatches || fuzzyMatch(`${parentLabel} ${label} ${child.dataset.value || ""}`, term);
          child.classList.toggle("is-hidden", !matches);
          childMatches = childMatches || matches;
        });
        const showParent = parentMatches || childMatches;
        item.classList.toggle("is-hidden", !showParent);
        item.classList.toggle("is-submenu-open", Boolean(term && showParent));
        return;
      }
      item.classList.toggle("is-hidden", !fuzzyMatch(`${item.textContent || ""} ${item.dataset.value || ""}`, term));
    });
  }

  function resetSubmenus(scope = document) {
    scope.querySelectorAll(".has-submenu.is-submenu-open").forEach((item) => {
      item.classList.remove("is-submenu-open");
    });
  }

  function closeDropdowns(except = null) {
    document.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
      if (dropdown === except) return;
      dropdown.classList.remove("is-open");
      resetSubmenus(dropdown);
      dropdown.querySelector(".dropdown-trigger")?.setAttribute("aria-expanded", "false");
    });
  }

  function chooseDropdownValue(type, value) {
    const select = selectForType(type);
    if (!select) return;
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    closeDropdowns();
  }

  function setupCustomDropdowns() {
    document.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
      const trigger = dropdown.querySelector(".dropdown-trigger");
      const search = dropdown.querySelector(".dropdown-search");
      const type = dropdown.dataset.filter;

      trigger?.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = !dropdown.classList.contains("is-open");
        closeDropdowns(dropdown);
        resetSubmenus(dropdown);
        dropdown.classList.toggle("is-open", willOpen);
        trigger.setAttribute("aria-expanded", String(willOpen));
        if (willOpen && search) {
          search.focus();
          search.select();
        }
      });

      dropdown.addEventListener("click", (event) => {
        event.stopPropagation();
        const submenuParent = event.target.closest(".has-submenu");
        const item = event.target.closest(".dropdown-item");
        if (!item || !dropdown.contains(item)) return;
        if (item.classList.contains("has-submenu") && submenuParent === item && !event.target.closest(".dropdown-submenu")) {
          dropdown.querySelectorAll(".has-submenu.is-submenu-open").forEach((openItem) => {
            if (openItem !== item) openItem.classList.remove("is-submenu-open");
          });
          item.classList.toggle("is-submenu-open");
          return;
        }
        if (item.dataset.value) {
          chooseDropdownValue(type, item.dataset.value);
        }
      });

      dropdown.addEventListener("mouseover", (event) => {
        const parent = event.target.closest(".has-submenu");
        if (!parent || !dropdown.contains(parent)) return;
        if (search?.value.trim()) return;
        dropdown.querySelectorAll(".has-submenu.is-submenu-open").forEach((openItem) => {
          if (openItem !== parent) openItem.classList.remove("is-submenu-open");
        });
      });

      dropdown.addEventListener("mouseleave", () => {
        if (!search?.value.trim()) resetSubmenus(dropdown);
      });

      search?.addEventListener("input", () => filterDropdownOptions(dropdown, search.value));
      search?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeDropdowns();
      });
    });

    document.addEventListener("click", () => closeDropdowns());
    document.addEventListener("mousemove", (event) => {
      document.querySelectorAll(".custom-dropdown.is-open").forEach((dropdown) => {
        if (!dropdown.contains(event.target)) resetSubmenus(dropdown);
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDropdowns();
    });
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
        : "Choose a different exam, subject, topic, or year.";
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
      ? `${question.exam} / ${question.subject} / ${question.topic} / ${question.testSeries}`
      : `${question.exam} / ${question.subject} / ${question.topic} / ${question.year}`;
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
    populateExams();
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
    const key = selectionKey();
    const selectedState = {
      ...defaultState(),
      exam: state.exam,
      subject: state.subject,
      topic: state.topic,
      year: state.year,
      testSeries: state.testSeries,
      mode,
      currentIndex: state.currentIndex,
      draftAnswer: null,
      reviewMode: state.reviewMode,
      reviewIds: state.reviewMode ? state.reviewIds : [],
      deletedCustomIds: mode === "custom" ? deletedIdsForSelection(state) : [],
      exams: examForSelection(state.exams, key)
    };
    const thirdValue = mode === "custom" ? state.testSeries : state.year;
    const blob = new Blob([JSON.stringify({
      app: "Only PYQs BPSC Science Practice",
      scope: "selection",
      mode,
      selectionKey: key,
      exportedAt: new Date().toISOString(),
      state: selectedState
    }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `only-pyqs-bpsc-${filePart(mode)}-${filePart(state.exam)}-${filePart(state.subject)}-${filePart(state.topic)}-${filePart(thirdValue)}-progress.json`;
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
      exam: importedState.exam || allExamsLabel,
      subject: importedState.subject || "All subjects",
      topic: importedState.topic || "All topics",
      year: importedState.year || "All years",
      testSeries: importedState.testSeries || "All series",
      mode: importedState.mode === "custom" ? "custom" : "pyq",
      reviewMode: Boolean(importedState.reviewMode),
      reviewIds: Array.isArray(importedState.reviewIds) ? importedState.reviewIds : [],
      deletedCustomIds: Array.isArray(importedState.deletedCustomIds) ? importedState.deletedCustomIds : [],
      currentIndex: Number.isFinite(importedState.currentIndex) ? importedState.currentIndex : 0,
      exams: importedState.exams || {}
    };
  }

  function applyImportedProgress(imported) {
    const importedState = normalizeImportedState(imported);
    const importedMode = importedState.mode;
    const importedKey = imported.selectionKey || selectionKeyFromState(importedState);
    const currentKey = selectionKey();
    const importedLegacyKey = legacySelectionKey(importedState);
    const currentLegacyKey = legacySelectionKey(state);
    if (importedMode !== state.mode) {
      throw new Error(`This is ${importedMode === "custom" ? "Custom" : "PYQ"} Mode progress. Switch to ${importedMode === "custom" ? "Custom" : "PYQ"} Mode before uploading it.`);
    }
    if (importedKey !== currentKey && !(importedKey === currentLegacyKey && state.exam === allExamsLabel) && !(importedLegacyKey === currentLegacyKey && importedState.exam === allExamsLabel && state.exam === allExamsLabel)) {
      const thirdLabel = importedMode === "custom" ? "test series" : "year";
      const thirdValue = importedMode === "custom" ? importedState.testSeries : importedState.year;
      throw new Error(`This progress file is for ${importedState.exam || allExamsLabel} / ${importedState.subject} / ${importedState.topic} / ${thirdValue}. Select that exam and ${thirdLabel} before uploading it.`);
    }

    delete state.exams[currentKey];
    Object.assign(state.exams, examForSelection(importedState.exams, importedKey));
    if (!state.exams[currentKey] && importedState.exams?.[importedLegacyKey]) {
      state.exams[currentKey] = importedState.exams[importedLegacyKey];
    }

    state.exam = importedState.exam;
    state.subject = importedState.subject;
    state.topic = importedState.topic;
    state.year = importedState.year;
    state.testSeries = importedState.testSeries;
    state.currentIndex = importedState.currentIndex;
    state.draftAnswer = null;
    state.reviewMode = importedState.reviewMode;
    state.reviewIds = importedState.reviewIds;
    if (importedMode === "custom") {
      state.deletedCustomIds = [
        ...withoutSelectionDeletedIds(importedState),
        ...deletedIdsForSelection(importedState)
      ];
    }
    populateExams();
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
    state.exam = allExamsLabel;
    state.topic = "All topics";
    state.year = "All years";
    state.testSeries = "All series";
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    populateSubjects();
    populateExams();
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

  function handleSubjectFilterChange(value) {
    state.subject = value;
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
    renderCustomDropdown("subject");
  }

  function handleExamFilterChange(value) {
    state.exam = value;
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    populateTopics();
    populateYears();
    openQuestion(0);
    renderCustomDropdown("exam");
  }

  function handleTopicFilterChange(value) {
    state.topic = value;
    state.year = "All years";
    state.testSeries = "All series";
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    populateYears();
    openQuestion(0);
    renderCustomDropdown("topic");
  }

  function handleYearFilterChange(value) {
    if (isCustomMode()) {
      state.testSeries = value;
    } else {
      state.year = value;
    }
    state.reviewMode = false;
    state.reviewIds = [];
    state.currentIndex = 0;
    state.draftAnswer = null;
    openQuestion(0);
    renderCustomDropdown("year");
  }

  window.handleSubjectFilterChange = handleSubjectFilterChange;
  window.handleExamFilterChange = handleExamFilterChange;
  window.handleTopicFilterChange = handleTopicFilterChange;
  window.handleYearFilterChange = handleYearFilterChange;

  els.examSelect.addEventListener("change", () => handleExamFilterChange(els.examSelect.value));
  els.subjectSelect.addEventListener("change", () => handleSubjectFilterChange(els.subjectSelect.value));
  els.topicSelect.addEventListener("change", () => handleTopicFilterChange(els.topicSelect.value));
  els.yearSelect.addEventListener("change", () => handleYearFilterChange(els.yearSelect.value));

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
  setupCustomDropdowns();
  bindFilterPillOpeners();
  populateExams();
  populateSubjects();
  populateTopics();
  populateYears();
  openQuestion(state.currentIndex);
})();
