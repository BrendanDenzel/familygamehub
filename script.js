const canvas = document.getElementById("drawingBoard");
const ctx = canvas.getContext("2d");

const wordDisplay = document.getElementById("wordDisplay");
const newWordBtn = document.getElementById("newWordBtn");

const clearBtn = document.getElementById("clearBtn");
const restartBtn = document.getElementById("restartBtn");

const brushSizeInput = document.getElementById("brushSize");
const colorPicker = document.getElementById("colorPicker");

const timerDisplay = document.getElementById("timerDisplay");
const resetTimerBtn = document.getElementById("resetTimerBtn")
const timeUpNotification = document.getElementById("timeUpNotification");



let drawing = false;
let brushSize = 5;
let color = "#ffffff";

// ⏱ TIMER VARIABLES
let timerDuration = 90; // 90 seconds
let timeLeft = timerDuration;
let timerInterval = null;
let timerActive = false;

// 🎯 HIGH QUALITY CANVAS SCALING
function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 🎨 POINTER EVENTS
canvas.addEventListener("pointerdown", (e) => {
  if (timeLeft <= 0) return; // prevent drawing if timer ended

  drawing = true;
  ctx.beginPath();
  ctx.moveTo(getX(e), getY(e));

  // start timer automatically on first draw
  if (!timerActive) startTimer();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing || timeLeft <= 0) return;

  ctx.lineWidth = brushSize;
  ctx.strokeStyle = color;

  ctx.lineTo(getX(e), getY(e));
  ctx.stroke();
});

canvas.addEventListener("pointerup", () => {
  drawing = false;
  ctx.beginPath();
});

canvas.addEventListener("pointerleave", () => {
  drawing = false;
  ctx.beginPath();
});

function getX(e) {
  const rect = canvas.getBoundingClientRect();
  return e.clientX - rect.left;
}

function getY(e) {
  const rect = canvas.getBoundingClientRect();
  return e.clientY - rect.top;
}

// 🎚 CONTROLS
brushSizeInput.addEventListener("input", e => {
  brushSize = e.target.value;
});

colorPicker.addEventListener("input", e => {
  color = e.target.value;
});

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resetTimer(); // optional: reset timer when clearing
});

resetTimerBtn.addEventListener("click", () => {
  resetTimer();
});

// 🎲 WORD GENERATOR
newWordBtn.addEventListener("click", () => {
  const randomWord = words[Math.floor(Math.random() * words.length)];
  wordDisplay.textContent = randomWord;
});



function showTimeUpNotification() {
  timeUpNotification.classList.add("show");

  // auto-hide after 3 seconds
  timeUpTimeout = setTimeout(() => {
    hideTimeUpNotification();
  }, 3000);
}

function hideTimeUpNotification() {
  timeUpNotification.classList.remove("show");
  clearTimeout(timeUpTimeout);
}


// ⏱ TIMER FUNCTIONS
function startTimer() {
  timerActive = true;

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerActive = false;
      drawing = false;
      showTimeUpNotification(); // show dropdown instead of alert
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerActive = false;
  timeLeft = timerDuration;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  timerDisplay.textContent = timeLeft; // just show seconds
}


// RESET TIMER BUTTON
resetTimerBtn.addEventListener("click", resetTimer);
