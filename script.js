"use strict";

const EXERCISES = [
  {
    tokens: ["La", "ragazza", "che", "abita", "vicino", "a", "casa", "mia", "è", "molto", "simpatica."],
    relative: [2, 3, 4, 5, 6, 7],
    substitute: [0, 1],
    role: "subject",
  },
  {
    tokens: ["Il", "libro", "che", "mi", "hai", "consigliato", "è", "davvero", "interessante."],
    relative: [2, 3, 4, 5],
    substitute: [0, 1],
    role: "object",
  },
  {
    tokens: ["Ho", "conosciuto", "una", "signora", "che", "parla", "cinque", "lingue."],
    relative: [4, 5, 6, 7],
    substitute: [2, 3],
    role: "subject",
  },
  {
    tokens: ["La", "pizza", "che", "abbiamo", "mangiato", "ieri", "era", "buonissima."],
    relative: [2, 3, 4, 5],
    substitute: [0, 1],
    role: "object",
  },
  {
    tokens: ["Il", "professore", "che", "insegna", "italiano", "è", "molto", "paziente."],
    relative: [2, 3, 4],
    substitute: [0, 1],
    role: "subject",
  },
  {
    tokens: ["Non", "riesco", "a", "trovare", "il", "documento", "che", "ho", "salvato", "ieri", "sul", "computer."],
    relative: [6, 7, 8, 9, 10, 11],
    substitute: [4, 5],
    role: "object",
  },
  {
    tokens: ["La", "mia", "amica", "che", "vive", "a", "Milano", "si", "è", "appena", "sposata."],
    relative: [3, 4, 5, 6],
    substitute: [0, 1, 2],
    role: "subject",
  },
  {
    tokens: ["Il", "film", "che", "abbiamo", "visto", "insieme", "mi", "ha", "fatto", "piangere."],
    relative: [2, 3, 4, 5],
    substitute: [0, 1],
    role: "object",
  },
  {
    tokens: ["Sto", "frequentando", "un", "corso", "di", "italiano", "che", "mi", "piace", "molto."],
    relative: [6, 7, 8, 9],
    substitute: [2, 3, 4, 5],
    role: "subject",
  },
  {
    tokens: ["Il", "messaggio", "che", "mi", "hai", "mandato", "stamattina", "mi", "ha", "fatto", "molto", "piacere."],
    relative: [2, 3, 4, 5, 6],
    substitute: [0, 1],
    role: "object",
  },
];

const state = {
  view: "part-1",
  current: { part1: 0, part2: 0 },
  mode: "main",
  part1: EXERCISES.map((item) => ({
    selections: Array(item.tokens.length).fill(null),
    status: null,
    attempted: false,
  })),
  part2: EXERCISES.map(() => ({
    selected: [],
    role: null,
    status: null,
    attempted: false,
  })),
  completed: { part1: false, part2: false },
};

const elements = {
  views: {
    "part-1": document.querySelector("#part-1"),
    "part-2": document.querySelector("#part-2"),
    result: document.querySelector("#result"),
  },
  progressLabel: document.querySelector("#progress-label"),
  progressBar: document.querySelector("#progress-bar"),
  part1Card: document.querySelector("#part-1-card"),
  part1Nav: document.querySelector("#part-1-nav"),
  part1Feedback: document.querySelector("#part-1-feedback"),
  modeMain: document.querySelector("#mode-main"),
  modeRelative: document.querySelector("#mode-relative"),
  checkPart1: document.querySelector("#check-part-1"),
  continuePart1: document.querySelector("#continue-part-1"),
  part2Card: document.querySelector("#part-2-card"),
  part2Nav: document.querySelector("#part-2-nav"),
  part2Feedback: document.querySelector("#part-2-feedback"),
  checkPart2: document.querySelector("#check-part-2"),
  continuePart2: document.querySelector("#continue-part-2"),
};

function sameIndices(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function expectedPart1(item) {
  const relative = new Set(item.relative);
  return item.tokens.map((_, index) => relative.has(index) ? "relative" : "main");
}

function isPart1Complete(answer) {
  return answer.selections.every(Boolean);
}

function isPart2Complete(answer) {
  return answer.selected.length > 0 && Boolean(answer.role);
}

function isPart1Correct(index) {
  return state.part1[index].selections.every((value, tokenIndex) => value === expectedPart1(EXERCISES[index])[tokenIndex]);
}

function isPart2Correct(index) {
  const answer = state.part2[index];
  const item = EXERCISES[index];
  return sameIndices(answer.selected, item.substitute) && answer.role === item.role;
}

function setMode(mode) {
  state.mode = mode;
  elements.modeMain.classList.toggle("is-active", mode === "main");
  elements.modeMain.setAttribute("aria-pressed", String(mode === "main"));
  elements.modeRelative.classList.toggle("is-active", mode === "relative");
  elements.modeRelative.setAttribute("aria-pressed", String(mode === "relative"));
}

function itemStateLabel(answer, part) {
  if (answer.status === "correct") return "Corretta ✓";
  if (answer.status === "wrong") return "Da correggere";
  const complete = part === 1 ? isPart1Complete(answer) : isPart2Complete(answer);
  return complete ? "Completata" : "Da completare";
}

function itemFeedback(answer, part) {
  if (!answer.attempted) return "";
  if (answer.status === "correct") {
    return '<p class="item-feedback is-correct">Corretto! ✓</p>';
  }
  if (part === 1 && !isPart1Complete(answer)) {
    return '<p class="item-feedback is-error">Seleziona tutte le parole: ogni parola appartiene alla frase principale o alla frase relativa.</p>';
  }
  if (part === 2 && !isPart2Complete(answer)) {
    return '<p class="item-feedback is-error">Completa entrambi i passaggi prima di ricontrollare.</p>';
  }
  const hint = part === 1
    ? "Riprova: la frase relativa include CHE; ciò che resta forma la frase principale."
    : "Riprova: trova il gruppo nominale ripreso da CHE e osserva chi compie l’azione nella frase relativa.";
  return `<p class="item-feedback is-error">${hint}</p>`;
}

function renderPart1() {
  const index = state.current.part1;
  const item = EXERCISES[index];
  const answer = state.part1[index];
  const locked = answer.status === "correct";

  const tokens = item.tokens.map((token, tokenIndex) => {
    const selection = answer.selections[tokenIndex];
    const className = selection ? ` is-${selection}` : "";
    const selectedLabel = selection === "main"
      ? ", frase principale"
      : selection === "relative" ? ", frase relativa" : ", non selezionata";
    return `<li><button class="token-button${className}" type="button" data-token="${tokenIndex}" aria-label="${token}${selectedLabel}"${locked ? " disabled" : ""}>${token}</button></li>`;
  }).join("");

  elements.part1Card.innerHTML = `
    <div class="question-header">
      <p class="question-number">Frase ${index + 1}</p>
      <p class="question-state">${itemStateLabel(answer, 1)}</p>
    </div>
    <ul class="token-list" aria-label="Seleziona le parole della frase">${tokens}</ul>
    <p class="question-hint">Puoi cambiare colore in qualsiasi momento e correggere la selezione.</p>
    ${itemFeedback(answer, 1)}
  `;

  elements.part1Card.querySelectorAll("[data-token]").forEach((button) => {
    button.addEventListener("click", () => {
      const tokenIndex = Number(button.dataset.token);
      answer.selections[tokenIndex] = answer.selections[tokenIndex] === state.mode ? null : state.mode;
      answer.status = null;
      renderPart1();
      renderNav(1);
    });
  });
  renderNav(1);
}

function renderPart2() {
  const index = state.current.part2;
  const item = EXERCISES[index];
  const answer = state.part2[index];
  const locked = answer.status === "correct";

  const tokens = item.tokens.map((token, tokenIndex) => {
    const isChe = token.toLocaleLowerCase("it-IT").replace(/[.,!?]/g, "") === "che";
    const selected = answer.selected.includes(tokenIndex);
    const className = isChe ? " is-che" : selected ? " is-substitute" : "";
    const disabled = isChe || locked;
    const label = isChe ? `${token}, pronome relativo` : `${token}${selected ? ", selezionata" : ", non selezionata"}`;
    return `<li><button class="token-button${className}" type="button" data-token="${tokenIndex}" aria-label="${label}"${disabled ? " disabled" : ""}>${token}</button></li>`;
  }).join("");

  const option = (value, italian, chinese) => `
    <label class="function-option${answer.role === value ? " is-selected" : ""}">
      <input type="radio" name="che-role" value="${value}"${answer.role === value ? " checked" : ""}${locked ? " disabled" : ""}>
      <span>${italian}<small lang="zh-CN">${chinese}</small></span>
    </label>`;

  elements.part2Card.innerHTML = `
    <div class="question-header">
      <p class="question-number">Frase ${index + 1}</p>
      <p class="question-state">${itemStateLabel(answer, 2)}</p>
    </div>
    <p class="step-title">1. CHE sostituisce…｜CHE 所代替的词</p>
    <ul class="token-list" aria-label="Seleziona la parola o il gruppo di parole sostituito da CHE">${tokens}</ul>
    <div class="step-block">
      <p class="step-title">2. Funzione di CHE nella frase relativa｜CHE 的语法作用</p>
      <div class="function-options">
        ${option("subject", "Soggetto", "主语")}
        ${option("object", "Oggetto diretto", "直接宾语")}
      </div>
    </div>
    ${itemFeedback(answer, 2)}
  `;

  elements.part2Card.querySelectorAll("[data-token]:not(:disabled)").forEach((button) => {
    button.addEventListener("click", () => {
      const tokenIndex = Number(button.dataset.token);
      answer.selected = answer.selected.includes(tokenIndex)
        ? answer.selected.filter((value) => value !== tokenIndex)
        : [...answer.selected, tokenIndex].sort((a, b) => a - b);
      answer.status = null;
      renderPart2();
      renderNav(2);
    });
  });

  elements.part2Card.querySelectorAll('input[name="che-role"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      answer.role = radio.value;
      answer.status = null;
      renderPart2();
      renderNav(2);
    });
  });
  renderNav(2);
}

function renderNav(part) {
  const nav = part === 1 ? elements.part1Nav : elements.part2Nav;
  const answers = part === 1 ? state.part1 : state.part2;
  const current = part === 1 ? state.current.part1 : state.current.part2;
  nav.innerHTML = answers.map((answer, index) => {
    const complete = part === 1 ? isPart1Complete(answer) : isPart2Complete(answer);
    const statusClass = answer.status ? ` is-${answer.status}` : complete ? " is-answered" : "";
    const currentClass = index === current ? " is-current" : "";
    const labelState = itemStateLabel(answer, part);
    return `<button class="nav-button${statusClass}${currentClass}" type="button" data-question="${index}" aria-label="Frase ${index + 1}: ${labelState}"${index === current ? ' aria-current="true"' : ""}>${index + 1}</button>`;
  }).join("");

  nav.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => {
      if (part === 1) {
        state.current.part1 = Number(button.dataset.question);
        renderPart1();
      } else {
        state.current.part2 = Number(button.dataset.question);
        renderPart2();
      }
      document.querySelector(part === 1 ? "#part-1-card" : "#part-2-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}

function checkPart(part) {
  const answers = part === 1 ? state.part1 : state.part2;
  const checker = part === 1 ? isPart1Correct : isPart2Correct;
  const completeChecker = part === 1 ? isPart1Complete : isPart2Complete;
  const feedback = part === 1 ? elements.part1Feedback : elements.part2Feedback;
  const continueButton = part === 1 ? elements.continuePart1 : elements.continuePart2;

  answers.forEach((answer, index) => {
    answer.attempted = true;
    answer.status = completeChecker(answer) && checker(index) ? "correct" : "wrong";
  });

  const firstWrong = answers.findIndex((answer) => answer.status === "wrong");
  if (firstWrong === -1) {
    state.completed[part === 1 ? "part1" : "part2"] = true;
    feedback.textContent = "Bravissimo/a! Tutto corretto! 🎉";
    feedback.className = "part-feedback is-success";
    continueButton.hidden = false;
  } else {
    state.completed[part === 1 ? "part1" : "part2"] = false;
    feedback.textContent = "Ci sono ancora alcune risposte da rivedere. Correggi le frasi indicate e controlla di nuovo.";
    feedback.className = "part-feedback is-error";
    continueButton.hidden = true;
    if (part === 1) state.current.part1 = firstWrong;
    else state.current.part2 = firstWrong;
  }

  if (part === 1) renderPart1();
  else renderPart2();
}

function showView(view) {
  state.view = view;
  Object.entries(elements.views).forEach(([name, element]) => {
    element.hidden = name !== view;
  });

  const progress = view === "part-1" ? 33.333 : view === "part-2" ? 66.666 : 100;
  elements.progressBar.style.width = `${progress}%`;
  elements.progressLabel.textContent = view === "part-1" ? "Parte 1 di 2" : view === "part-2" ? "Parte 2 di 2" : "Completato";
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector("#exercise").focus({ preventScroll: true });
}

function resetExercise() {
  state.current.part1 = 0;
  state.current.part2 = 0;
  state.mode = "main";
  state.part1 = EXERCISES.map((item) => ({
    selections: Array(item.tokens.length).fill(null),
    status: null,
    attempted: false,
  }));
  state.part2 = EXERCISES.map(() => ({ selected: [], role: null, status: null, attempted: false }));
  state.completed.part1 = false;
  state.completed.part2 = false;
  elements.part1Feedback.textContent = "";
  elements.part1Feedback.className = "part-feedback";
  elements.part2Feedback.textContent = "";
  elements.part2Feedback.className = "part-feedback";
  elements.continuePart1.hidden = true;
  elements.continuePart2.hidden = true;
  setMode("main");
  renderPart1();
  renderPart2();
  showView("part-1");
}

elements.modeMain.addEventListener("click", () => setMode("main"));
elements.modeRelative.addEventListener("click", () => setMode("relative"));
elements.checkPart1.addEventListener("click", () => checkPart(1));
elements.checkPart2.addEventListener("click", () => checkPart(2));
elements.continuePart1.addEventListener("click", () => showView("part-2"));
elements.continuePart2.addEventListener("click", () => showView("result"));
document.querySelector("#back-to-part-1").addEventListener("click", () => showView("part-1"));
document.querySelector("#back-to-part-2").addEventListener("click", () => showView("part-2"));
document.querySelector("#restart").addEventListener("click", resetExercise);

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches("input")) event.preventDefault();
});

renderPart1();
renderPart2();
showView("part-1");

window.__CHE_EXERCISE_TEST__ = {
  EXERCISES,
  state,
  expectedPart1,
  isPart1Correct,
  isPart2Correct,
  checkPart,
  showView,
  resetExercise,
};
