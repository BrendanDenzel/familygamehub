const canvas = document.getElementById("drawingBoard");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const clearBtn = document.getElementById("clearBtn");

const brushSizeInput = document.getElementById("brushSize");
const colorPicker = document.getElementById("colorPicker");

const timerDisplay = document.getElementById("timerDisplay");
const timeUpNotification = document.getElementById("timeUpNotification");

const drawBtn = document.getElementById("drawBtn");
const eraserBtn = document.getElementById("eraserBtn");
const resetBoardBtn = document.getElementById("resetBoardBtn");

let currentTool = "draw";




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

  // SAVE current drawing
  const savedImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // RESTORE drawing
  ctx.putImageData(savedImage, 0, 0);
}


function getActualBrushSize() {
  const min = parseInt(brushSizeInput.min);
  const max = parseInt(brushSizeInput.max);
  const sliderValue = parseInt(brushSizeInput.value);

  const percent = (sliderValue - min) / (max - min);

  if (currentTool === "eraser") {

    if (percent <= 0.5) {
      // Under halfway → bigger boost
      return sliderValue * 2.2;
    } else {
      // Over halfway → smaller boost
      return sliderValue * 1.5;
    }

  }

  return sliderValue; // draw tool normal
}




window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 🎨 POINTER EVENTS
canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
  if (timeLeft <= 0) return; // prevent drawing if timer ended

  drawing = true;
  ctx.beginPath();
  ctx.moveTo(getX(e), getY(e));

  // start timer automatically on first draw
  if (!timerActive) startTimer();
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing || timeLeft <= 0) return;

  ctx.lineWidth = getActualBrushSize();

  if (currentTool === "draw") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
  } else {
    ctx.globalCompositeOperation = "destination-out";
  }

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
});

resetBoardBtn.addEventListener("click", () => {

  // Clear board
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset timer
  resetTimer();

  // Reset brush size
  brushSize = 5;
  brushSizeInput.value = 5;

  // Reset color
  color = "#ffffff";
  colorPicker.value = "#ffffff";

  // Reset tool
  currentTool = "draw";
  drawBtn.classList.add("activeTool");
  eraserBtn.classList.remove("activeTool");

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

drawBtn.addEventListener("click", () => {
  currentTool = "draw";
  drawBtn.classList.add("activeTool");
  eraserBtn.classList.remove("activeTool");
});

eraserBtn.addEventListener("click", () => {
  currentTool = "eraser";
  eraserBtn.classList.add("activeTool");
  drawBtn.classList.remove("activeTool");
});


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

