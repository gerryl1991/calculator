// ---------- Math functions ----------
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
function multiply(a, b) { return a * b; }
function divide(a, b) { return b === 0 ? null : a / b; } // null signals divide-by-zero

// calls the right math function for the chosen operator
function operate(operator, a, b) {
  switch (operator) {
    case "+": return add(a, b);
    case "-": return subtract(a, b);
    case "*": return multiply(a, b);
    case "/": return divide(a, b);
    default: return null;
  }
}

// ---------- State ----------
const MAX_DIGITS = 12;
const SYMBOLS = { "+": "+", "-": "\u2212", "*": "\u00d7", "/": "\u00f7" };
const SNARKY_MESSAGES = [
  "Nice try. Dividing by zero isn't happening.",
  "Zero called. It said no.",
  "I'm a calculator, not a magician.",
  "Math says no. So do I.",
  "Nope. Not today, not ever.",
  "That's not how any of this works."
];

const state = {
  displayValue: "0",   // number being typed, or the latest result
  firstNumber: null,   // stored number waiting for an operation
  operator: null,      // chosen operator
  resetNext: false,    // next digit starts a fresh number
  hasError: false,
  history: ""          // full expression shown above the result
};

const currentEl = document.getElementById("current");
const expressionEl = document.getElementById("expression");
const decimalBtn = document.getElementById("decimal");

// ---------- Display ----------
function formatResult(number) {
  let rounded = parseFloat(number.toPrecision(10));   // kills 0.1+0.2 style noise
  let text = String(rounded);
  if (text.length > MAX_DIGITS) text = rounded.toExponential(5);
  return text;
}

function updateDisplay() {
  const text = state.displayValue;
  currentEl.textContent = text;
  currentEl.classList.toggle("error", state.hasError);
  currentEl.classList.toggle("small", !state.hasError && text.length > 9);
  currentEl.classList.toggle("tiny", !state.hasError && text.length > 14);
  expressionEl.textContent = state.hasError ? "" : state.history;
  updateDecimalButton();
  highlightOperator();
}

function updateDecimalButton() {
  decimalBtn.disabled = state.displayValue.includes(".") && !state.resetNext;
}

function highlightOperator() {
  document.querySelectorAll(".op").forEach(btn => {
    btn.classList.toggle("active", state.resetNext && btn.dataset.key === state.operator);
  });
}

// ---------- Typing numbers ----------
function startFreshNumberIfNeeded() {
  if (state.hasError) clearAll();
  if (!state.resetNext) return;
  if (!state.operator) state.history = "";   // finished expression -> start over
  state.displayValue = "0";
  state.resetNext = false;
}

function inputDigit(digit) {
  startFreshNumberIfNeeded();
  if (state.displayValue.replace(/[-.]/g, "").length >= MAX_DIGITS) return;
  state.displayValue = state.displayValue === "0" ? digit : state.displayValue + digit;
  updateDisplay();
}

function inputDecimal() {
  startFreshNumberIfNeeded();
  if (state.displayValue.includes(".")) return;   // only one decimal point
  state.displayValue += ".";
  updateDisplay();
}

function backspace() {
  if (state.hasError) return clearAll();
  if (state.resetNext) return;                    // don't edit a finished result
  const value = state.displayValue;
  const isSingle = value.length === 1 || (value.length === 2 && value.startsWith("-"));
  state.displayValue = isSingle ? "0" : value.slice(0, -1);
  updateDisplay();
}

function clearAll() {
  state.displayValue = "0";
  state.firstNumber = null;
  state.operator = null;
  state.resetNext = false;
  state.hasError = false;
  state.history = "";
  updateDisplay();
}

// ---------- Calculating ----------
function getSnarkyMessage() {
  const index = Math.floor(Math.random() * SNARKY_MESSAGES.length);
  return SNARKY_MESSAGES[index];
}

// if divided by zero, show a message instead of crashing
function showDivideByZeroError() {
  clearAll();
  state.displayValue = getSnarkyMessage();
  state.hasError = true;
  state.resetNext = true;
  updateDisplay();
}

// evaluates one pair: firstNumber (operator) number on screen
function evaluatePair() {
  const second = parseFloat(state.displayValue);
  const result = operate(state.operator, state.firstNumber, second);
  if (result === null) {
    showDivideByZeroError();
    return null;
  }
  return result;
}

function chooseOperator(operator) {
  if (state.hasError) return;

  // operator pressed again without a second number: swap it
  if (state.operator && state.resetNext) {
    state.operator = operator;
    state.history = state.history.slice(0, -1) + SYMBOLS[operator];
    updateDisplay();
    return;
  }
  // a full pair exists: evaluate it before storing the next operator
  if (state.operator && state.firstNumber !== null) {
    const typed = state.displayValue;
    const result = evaluatePair();
    if (result === null) return;
    state.history += ` ${typed} ${SYMBOLS[operator]}`;   // keep every number visible
    state.firstNumber = result;
    state.displayValue = formatResult(result);
  } else {
    state.firstNumber = parseFloat(state.displayValue);
    state.history = `${state.displayValue} ${SYMBOLS[operator]}`;
  }
  state.operator = operator;
  state.resetNext = true;
  updateDisplay();
}

function equals() {
  if (state.hasError) return;
  // nothing to evaluate yet, or second number missing: ignore
  if (!state.operator || state.firstNumber === null || state.resetNext) return;
  const typed = state.displayValue;
  const result = evaluatePair();
  if (result === null) return;
  state.history = `${state.history} ${typed} =`;
  state.displayValue = formatResult(result);
  state.firstNumber = null;
  state.operator = null;
  state.resetNext = true;
  updateDisplay();
}

// ---------- Buttons and keyboard (one shared path) ----------
function press(key) {
  if (/^\d$/.test(key)) inputDigit(key);
  else if ("+-*/".includes(key)) chooseOperator(key);
  else if (key === ".") inputDecimal();
  else if (key === "Enter" || key === "=") equals();
  else if (key === "Backspace") backspace();
  else if (key === "Escape" || key === "Delete") clearAll();
}

function init() {
  // mouse
  document.querySelector(".keys").addEventListener("click", event => {
    const btn = event.target.closest("button");
    if (btn) press(btn.dataset.key);
  });

  // keyboard
  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Enter" || event.key === "/") event.preventDefault();
    press(event.key);
  });

  updateDisplay();
}

init();