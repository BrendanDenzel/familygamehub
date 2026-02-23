// script.js (ESM)
// Firebase + Firestore + Anonymous Auth (production-safe)
// Includes: party create/join, host start/reveal/reset, tap-to-reveal word for 5s
// Fixes: host panel not showing (auth timing), duplicate/miswired host logic, bad debug line,
// role tag hidden until reveal, word reveal works, safe hiding of legacy word controls.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  setDoc as setSubDoc,
  deleteDoc,
  deleteField
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* ================================
   FIREBASE CONFIG
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAScIOYzCChnKND2cfSo_MsvgdibC5dxeg",
  authDomain: "imposter-c7436.firebaseapp.com",
  projectId: "imposter-c7436",
  storageBucket: "imposter-c7436.firebasestorage.app",
  messagingSenderId: "1092375568262",
  appId: "1:1092375568262:web:5fe7f7e18b686a335dd607"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ================================
   WORDS (always random)
================================ */
// Default built-in word bank (host can override via textarea)
const WORD_BANK = [
  { word: "APPLE", hint: "orchard" },
{ word: "BANANA", hint: "tropical" },
{ word: "PIZZA", hint: "delivery" },
{ word: "BURGER", hint: "drive-thru" },
{ word: "SPAGHETTI", hint: "sauce" },
{ word: "SUSHI", hint: "chopsticks" },
{ word: "PANCAKES", hint: "syrup" },
{ word: "DONUT", hint: "sprinkles" },
{ word: "CUPCAKE", hint: "frosting" },
{ word: "POPCORN", hint: "movies" },

{ word: "TOOTHBRUSH", hint: "morning" },
{ word: "MIRROR", hint: "reflection" },
{ word: "UMBRELLA", hint: "storm" },
{ word: "BACKPACK", hint: "school" },
{ word: "SUITCASE", hint: "airport" },
{ word: "NOTEBOOK", hint: "spiral" },
{ word: "PENCIL", hint: "eraser" },
{ word: "LIGHTBULB", hint: "idea" },
{ word: "HEADPHONES", hint: "playlist" },
{ word: "BATTERY", hint: "power" },

{ word: "MICROWAVE", hint: "leftovers" },
{ word: "BLENDER", hint: "smoothie" },
{ word: "VACUUM", hint: "carpet" },
{ word: "KEYBOARD", hint: "typing" },
{ word: "REMOTE", hint: "couch" },
{ word: "CANDLE", hint: "birthday" },
{ word: "SCISSORS", hint: "crafts" },
{ word: "CLOCK", hint: "alarm" },
{ word: "BACKPACK", hint: "locker" },
{ word: "SUITCASE", hint: "vacation" },

{ word: "SCHOOL", hint: "homework" },
{ word: "HOSPITAL", hint: "emergency" },
{ word: "AIRPORT", hint: "boarding" },
{ word: "BEACH", hint: "waves" },
{ word: "LIBRARY", hint: "quiet" },
{ word: "RESTAURANT", hint: "menu" },
{ word: "MUSEUM", hint: "history" },
{ word: "PARK", hint: "playground" },
{ word: "ZOO", hint: "exhibit" },
{ word: "GYM", hint: "workout" },

{ word: "HOTEL", hint: "check-in" },
{ word: "BANK", hint: "deposit" },
{ word: "FACTORY", hint: "assembly" },
{ word: "STADIUM", hint: "crowd" },
{ word: "SUPERMARKET", hint: "aisle" },
{ word: "COURTROOM", hint: "judge" },
{ word: "FIRE STATION", hint: "sirens" },
{ word: "POLICE STATION", hint: "badge" },

{ word: "ELEPHANT", hint: "safari" },
{ word: "DOG", hint: "leash" },
{ word: "CAT", hint: "purring" },
{ word: "LION", hint: "pride" },
{ word: "TIGER", hint: "stripes" },
{ word: "GIRAFFE", hint: "tall" },
{ word: "ZEBRA", hint: "patterns" },
{ word: "MONKEY", hint: "jungle" },
{ word: "SHARK", hint: "fins" },
{ word: "DOLPHIN", hint: "echo" },

{ word: "PENGUIN", hint: "ice" },
{ word: "EAGLE", hint: "soaring" },
{ word: "OWL", hint: "night" },
{ word: "SNAKE", hint: "slither" },
{ word: "FROG", hint: "pond" },
{ word: "HORSE", hint: "stable" },
{ word: "COW", hint: "pasture" },
{ word: "PIG", hint: "mud" },
{ word: "CHICKEN", hint: "coop" },
{ word: "RABBIT", hint: "burrow" },

{ word: "ROBOT", hint: "metal" },
{ word: "SPACESHIP", hint: "launch" },
{ word: "TIME", hint: "clock" },
{ word: "SHADOW", hint: "light" },
{ word: "DREAM", hint: "sleep" },
{ word: "MAGNET", hint: "attract" },
{ word: "INVISIBLE", hint: "hidden" },
{ word: "SECRET", hint: "whisper" },
{ word: "LUCK", hint: "chance" },
{ word: "NOISE", hint: "loud" },

{ word: "POWER", hint: "energy" },
{ word: "SPEED", hint: "fast" },
{ word: "BALANCE", hint: "steady" },
{ word: "FREEDOM", hint: "choice" },
{ word: "MEMORY", hint: "past" },
{ word: "SURPRISE", hint: "unexpected" },
{ word: "DANGER", hint: "warning" },
{ word: "CHAOS", hint: "mess" },
{ word: "TEAMWORK", hint: "together" },
{ word: "VICTORY", hint: "celebration" },

{ word: "ORANGE", hint: "citrus" },
{ word: "STRAWBERRY", hint: "seeds" },
{ word: "WATERMELON", hint: "summer" },
{ word: "GRAPES", hint: "vine" },
{ word: "LEMON", hint: "sour" },
{ word: "CHERRY", hint: "pit" },
{ word: "PEACH", hint: "fuzzy" },
{ word: "PINEAPPLE", hint: "tropical" },
{ word: "COCONUT", hint: "island" },
{ word: "BLUEBERRY", hint: "muffin" },

{ word: "SANDWICH", hint: "layers" },
{ word: "TACO", hint: "shell" },
{ word: "BURRITO", hint: "wrapped" },
{ word: "FRIES", hint: "ketchup" },
{ word: "STEAK", hint: "grill" },
{ word: "OMELET", hint: "breakfast" },
{ word: "SALAD", hint: "dressing" },
{ word: "CEREAL", hint: "morning" },
{ word: "MILKSHAKE", hint: "straw" },
{ word: "COOKIES", hint: "baking" },

{ word: "BED", hint: "sleep" },
{ word: "PILLOW", hint: "soft" },
{ word: "BLANKET", hint: "warm" },
{ word: "LAMP", hint: "nightstand" },
{ word: "CURTAINS", hint: "window" },
{ word: "COUCH", hint: "living room" },
{ word: "TABLE", hint: "dinner" },
{ word: "CHAIR", hint: "sit" },
{ word: "DOOR", hint: "knob" },
{ word: "WINDOW", hint: "glass" },

{ word: "SHOWER", hint: "steam" },
{ word: "SOAP", hint: "bubbles" },
{ word: "TOWEL", hint: "dry" },
{ word: "COMB", hint: "hair" },
{ word: "SHAMPOO", hint: "lather" },
{ word: "RAZOR", hint: "shave" },
{ word: "SINK", hint: "faucet" },
{ word: "TOILET", hint: "flush" },
{ word: "TOOTHPASTE", hint: "mint" },
{ word: "BATH", hint: "tub" },

{ word: "BICYCLE", hint: "pedal" },
{ word: "CAR", hint: "drive" },
{ word: "BUS", hint: "route" },
{ word: "TRAIN", hint: "tracks" },
{ word: "BOAT", hint: "dock" },
{ word: "HELICOPTER", hint: "blades" },
{ word: "SUBWAY", hint: "underground" },
{ word: "TAXI", hint: "fare" },
{ word: "MOTORCYCLE", hint: "helmet" },
{ word: "SKATEBOARD", hint: "tricks" },

{ word: "DESERT", hint: "sand" },
{ word: "FOREST", hint: "trees" },
{ word: "MOUNTAIN", hint: "peak" },
{ word: "RIVER", hint: "flow" },
{ word: "LAKE", hint: "shore" },
{ word: "ISLAND", hint: "remote" },
{ word: "CAVE", hint: "dark" },
{ word: "VALLEY", hint: "low" },
{ word: "WATERFALL", hint: "mist" },
{ word: "GLACIER", hint: "ice" },

{ word: "RAIN", hint: "clouds" },
{ word: "SNOW", hint: "flakes" },
{ word: "WIND", hint: "gust" },
{ word: "LIGHTNING", hint: "storm" },
{ word: "THUNDER", hint: "boom" },
{ word: "RAINBOW", hint: "colors" },
{ word: "FOG", hint: "visibility" },
{ word: "HAIL", hint: "pellets" },
{ word: "SUNSHINE", hint: "bright" },
{ word: "BREEZE", hint: "cool" },

{ word: "CAMERA", hint: "flash" },
{ word: "PHONE", hint: "ring" },
{ word: "TABLET", hint: "touchscreen" },
{ word: "LAPTOP", hint: "portable" },
{ word: "PRINTER", hint: "ink" },
{ word: "MOUSE", hint: "click" },
{ word: "SCREEN", hint: "display" },
{ word: "CHARGER", hint: "plug" },
{ word: "WI-FI", hint: "signal" },
{ word: "PASSWORD", hint: "secure" }
];

/* ================================
   DOM
================================ */
const $ = (id) => document.getElementById(id);

const views = {
  home: $("homeView"),
  lobby: $("lobbyView"),
  game: $("gameView")
};

const navStatus = $("navStatus");

const hostName = $("hostName");
const createPartyBtn = $("createPartyBtn");

const joinCode = $("joinCode");
const joinName = $("joinName");
const joinPartyBtn = $("joinPartyBtn");

const partyCodeText = $("partyCodeText");
const copyCodeBtn = $("copyCodeBtn");
const leaveBtn = $("leaveBtn");

const playersList = $("playersList");
const hostPanel = $("hostPanel");

const hintToggle = $("hintToggle");
const hintOnlyIfImposterStartsToggle = $("hintOnlyIfImposterStartsToggle");
const wordBankInput = $("wordBankInput");
const useDefaultBankToggle = $("useDefaultBankToggle");
const customBankWrap = $("customBankWrap");

const imposterHintBox = $("imposterHintBox");
const imposterHintText = $("imposterHintText");

// legacy word controls (might not exist)
const wordInput = $("wordInput");
const randomWordBtn = $("randomWordBtn");

const startNewRoundBtn = $("startNewRoundBtn");
const startGameBtn = $("startGameBtn");
const showResultsBtn = $("showResultsBtn");
const resetPartyBtn = $("resetPartyBtn");

const roleTag = $("roleTag");
const wordDisplay = $("wordDisplay");
const firstPlayerName = $("firstPlayerName");
const revealBox = $("revealBox");
const imposterNameReveal = $("imposterNameReveal");
const backToLobbyBtn = $("backToLobbyBtn");

const toast = $("toast");
const homeBtn = $("homeBtn");

useDefaultBankToggle?.addEventListener("change", async () => {
  applyBankUI();
  if (!partyCode || !playerId) return;

  const p = await getDoc(partyRef(partyCode));
  if (!p.exists()) return;
  if (p.data().hostUid !== playerId) return;

  await updateDoc(partyRef(partyCode), {
    useDefaultBank: !!useDefaultBankToggle.checked
  });
});


hintToggle?.addEventListener("change", async () => {
  applyHintToggleLock();
  if (!partyCode || !playerId) return;

  const p = await getDoc(partyRef(partyCode));
  if (!p.exists()) return;
  if (p.data().hostUid !== playerId) return;

  await updateDoc(partyRef(partyCode), {
    hintEnabled: !!hintToggle.checked,
    // if turning off, force off the second setting in firestore too
    hintOnlyIfImposterStarts: hintToggle.checked ? !!hintOnlyIfImposterStartsToggle?.checked : false
  });
});

hintOnlyIfImposterStartsToggle?.addEventListener("change", async () => {
  applyHintToggleLock();
  if (!partyCode || !playerId) return;

  const p = await getDoc(partyRef(partyCode));
  if (!p.exists()) return;
  if (p.data().hostUid !== playerId) return;

  // only meaningful if hintToggle is on
  await updateDoc(partyRef(partyCode), {
    hintOnlyIfImposterStarts: !!hintOnlyIfImposterStartsToggle.checked
  });
});


/* ================================
   STATE
================================ */
let partyCode = null;
let playerId = null;     // Firebase auth uid
let playerName = null;
let isHost = false;

let unsubParty = null;
let unsubPlayers = null;

let lastPartyData = null;
let lobbyOverride = false; // host-only: stay in lobby even if game started

/* ================================
   TOAST + VIEW
================================ */
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2600);
}

function setView(name) {
  Object.values(views).forEach(v => v.classList.add("hidden"));
  views[name].classList.remove("hidden");
  navStatus.textContent =
    name === "home" ? "Lobby" : name === "lobby" ? "Lobby" : "Game";
}


/* ================================
   HELPERS
================================ */
function cleanCode(s) {
  return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function makeCode(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

playersList?.addEventListener("click", (e) => {
  const btn = e.target.closest?.("[data-kick]");
  if (!btn) return;
  const targetId = btn.getAttribute("data-kick");
  kickPlayer(targetId).catch((err) => {
    console.error("Kick failed:", err);
    showToast(err?.message || "Kick failed");
  });
});

async function kickPlayer(targetId) {
  if (!partyCode || !playerId) return;

  const p = await getDoc(partyRef(partyCode));
  if (!p.exists()) return;

  const data = p.data() || {};
  if (data.hostUid !== playerId) return showToast("Only the host can kick.");
  if (!targetId || targetId === playerId) return;

  // 1) Delete the player doc (boots them from the party)
  await deleteDoc(playerDocRef(partyCode, targetId));

  // 2) Mark them as kicked so their client can show a message and go home
  await updateDoc(partyRef(partyCode), {
    [`kicked.${targetId}`]: Date.now()
  });

  showToast("Player kicked.");
}

function partyRef(code) {
  return doc(db, "parties", code);
}

function playersRef(code) {
  return collection(db, "parties", code, "players");
}

function playerDocRef(code, pid) {
  return doc(db, "parties", code, "players", pid);
}

function escapeHtml(str) {
  return (str ?? "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

function parseWordBank(text) {
  const lines = (text || "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const out = [];
  for (const line of lines) {
    // Accept formats: WORD | hint   OR   WORD - hint
    const parts = line.split("|").map(s => s.trim());
    let word = parts[0] || "";
    let hint = parts.slice(1).join(" | ").trim();

    if (!hint && line.includes(" - ")) {
      const p2 = line.split(" - ").map(s => s.trim());
      word = p2[0] || word;
      hint = p2.slice(1).join(" - ").trim();
    }

    word = word.toUpperCase().replace(/[^A-Z0-9 ]/g, "").trim();

    if (word.length >= 2) {
      out.push({ word, hint: hint || "No hint provided." });
    }
  }
  return out;
}


function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWordWithRecency(bank, recentWords = [], seedNumber = Date.now()) {
  const rng = mulberry32(seedNumber);

  // normalize to uppercase words
  const recent = new Set((recentWords || []).map(w => String(w).toUpperCase()));

  // weights:
  // - normal words: 1.0
  // - recently used: 0.08 (still possible, just rare)
  // - tiny chaos so nothing becomes “mathematically obvious”
  const weights = bank.map(item => {
    const w = String(item.word || "").toUpperCase();
    const base = recent.has(w) ? 0.08 : 1.0;
    const chaos = 0.9 + rng() * 0.2; // 0.9..1.1
    return base * chaos;
  });

  let total = 0;
  for (const w of weights) total += w;

  let roll = rng() * total;
  for (let i = 0; i < bank.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return bank[i];
  }
  return bank[bank.length - 1];
}

// ================================
// WEIGHTED PICK (luck-debt + tiny chaos)
// ================================
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computeWeight({ roundNum, lastRound = 0, count = 0, wasLastRound = false }) {
  // rounds since last picked (if never picked, lastRound=0 => big since)
  const since = clamp(roundNum - (lastRound || 0), 1, 8);

  // 1) cooldown boost (more time since last pick => more weight)
  const cooldownBoost = 1 + 0.35 * since; // 1.35..3.8

  // 2) soft repeat penalty (still possible, just less likely)
  const repeatPenalty = wasLastRound ? 0.35 : 1;

  // 3) long-run balance (people who have been picked more get slightly less weight)
  const balancePenalty = 1 / (1 + 0.25 * (count || 0)); // 1, 0.80, 0.67, ...

  // 4) tiny chaos so it never feels deterministic
  const chaos = 0.9 + Math.random() * 0.2; // 0.9..1.1

  const w = cooldownBoost * repeatPenalty * balancePenalty * chaos;

  // Never let anyone hit 0 probability
  return Math.max(0.05, w);
}

function weightedPick(items, getWeight) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const weights = items.map((it) => Math.max(0.0001, Number(getWeight(it)) || 0.0001));
  const total = weights.reduce((a, b) => a + b, 0);

  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function applyHintToggleLock() {
  if (!hintToggle || !hintOnlyIfImposterStartsToggle) return;

  const enabled = !!hintToggle.checked;

  // Lock 2nd toggle off if first is off
  hintOnlyIfImposterStartsToggle.disabled = !enabled;
  if (!enabled) hintOnlyIfImposterStartsToggle.checked = false;
}

function setHintBoxVisible(show, text) {
  if (!imposterHintBox || !imposterHintText) return;
  if (!show) {
    imposterHintBox.classList.add("hidden");
    imposterHintText.textContent = "---";
    return;
  }
  imposterHintText.textContent = text || "No hint provided.";
  imposterHintBox.classList.remove("hidden");
}

function applyBankUI() {
  const useDefault = !!useDefaultBankToggle?.checked;

  // Hide/show textbox area
  if (customBankWrap) {
    customBankWrap.classList.toggle("hidden", useDefault);
  }
}

function setRevealButtonVisible(visible) {
  if (!showResultsBtn) return;
  // Inline style is the most reliable (beats CSS conflicts)
  showResultsBtn.style.display = visible ? "" : "none";
}


/* ================================
   AUTH (Anonymous)
================================ */
async function ensureAuth() {
  if (auth.currentUser?.uid) {
    playerId = auth.currentUser.uid;
    return playerId;
  }
  await signInAnonymously(auth);
  playerId = auth.currentUser?.uid ?? null;
  return playerId;
}

/* ================================
   HOST UI (single source of truth)
================================ */
function applyHostUI(data) {
  if (!data || !playerId) {
    isHost = false;
    if (hostPanel) hostPanel.style.display = "none";
    setRevealButtonVisible(false);
    if (showResultsBtn) showResultsBtn.disabled = true;
    return;
  }

  isHost = data.hostUid === playerId;
  // Host-only buttons on the game screen
if (startNewRoundBtn) startNewRoundBtn.classList.toggle("hidden", !isHost);
if (showResultsBtn) showResultsBtn.classList.toggle("hidden", !isHost);

  if (hostPanel) hostPanel.style.display = isHost ? "block" : "none";

  // ✅ Only host sees it
  setRevealButtonVisible(isHost);

  // enabled only when host + started + not revealed yet
  if (showResultsBtn) {
    showResultsBtn.disabled = !(isHost && data.started && !data.revealed);
  }
}

async function refreshPartyUI() {
  if (!partyCode) return;
  const snap = await getDoc(partyRef(partyCode));
  if (!snap.exists()) return;
  lastPartyData = snap.data();
  applyHostUI(lastPartyData);
}

// When auth finally arrives, re-apply host UI using the last party snapshot
onAuthStateChanged(auth, async (user) => {
  playerId = user?.uid ?? null;
  if (partyCode) {
    await refreshPartyUI();
  } else if (lastPartyData) {
    applyHostUI(lastPartyData);
  }
});

/* ================================
   ROLE TAG (hidden until reveal)
================================ */
function updateRoleTag(isImposter, revealed) {
  if (!roleTag) return;

  if (!revealed) {
    roleTag.textContent = "---";
    roleTag.style.borderColor = "rgba(99,102,241,0.35)";
    roleTag.style.background = "rgba(99,102,241,0.18)";
    return;
  }

  roleTag.textContent = isImposter ? "IMPOSTER" : "WORD";
  roleTag.style.borderColor = isImposter
    ? "rgba(239,68,68,0.35)"
    : "rgba(99,102,241,0.35)";
  roleTag.style.background = isImposter
    ? "rgba(239,68,68,0.18)"
    : "rgba(99,102,241,0.18)";
}

/* ================================
   TAP-TO-REVEAL (5 seconds)
   Requires CSS:
   .wordCovered { ... }
   .wordCovered::before { content: attr(data-word); filter: blur(...); ... }  (if using blur layer)
   .wordCovered::after  { content: "Click to reveal"; ... }
================================ */
let hideWordTimer = null;
let currentRealWord = "---";
let currentHintShouldShow = false;
let currentHintText = "No hint provided.";

function coverWord() {
  if (!wordDisplay) return;
  wordDisplay.classList.add("wordCovered");
  wordDisplay.classList.remove("wordRevealFlash");
  setHintBoxVisible(false); // 👈 optional safety
}

function revealWordFor5s() {
  if (!wordDisplay) return;

  // ensure both real + blurred layers have the right text
  wordDisplay.textContent = currentRealWord;
  wordDisplay.setAttribute("data-word", currentRealWord);

  const isImposterLocal = currentRealWord === "IMPOSTER";
  updateRoleTag(isImposterLocal, true);

  // actually reveal the real text
  wordDisplay.classList.remove("wordCovered");
  // Show hint only during reveal window (prevents giveaway)
  setHintBoxVisible(currentHintShouldShow, currentHintText);
  wordDisplay.classList.add("wordRevealFlash");
  setHintBoxVisible(currentHintShouldShow, currentHintText);
  clearTimeout(hideWordTimer);
  hideWordTimer = setTimeout(() => {
    coverWord();
    setHintBoxVisible(false);
    updateRoleTag(isImposterLocal, false);
  }, 5000); // change to 3000 if you prefer 3 seconds
}

if (wordDisplay) {
  wordDisplay.addEventListener("click", () => {
    if (!partyCode) return;
    revealWordFor5s();
  });
}

/* ================================
   RENDER
================================ */
function renderPlayers(players, hostUid) {
  if (!playersList) return;

  const hostIsMe = !!playerId && hostUid === playerId;

  playersList.innerHTML = "";
  for (const p of players) {
    const row = document.createElement("div");
    row.className = "player";

    const isHostRow = p.id === hostUid;
    const isMeRow = p.id === playerId;

    row.innerHTML = `
      <div>
        <div style="font-weight:800;">${escapeHtml(p.name)}</div>
        <div style="color:#94a3b8;font-size:12px;">${escapeHtml((p.id || "").slice(0, 6))}</div>
      </div>
      <div class="row gap">
        ${isHostRow ? `<span class="badge">HOST</span>` : ``}
        ${isMeRow ? `<span class="badge" style="margin-left:8px;background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.12)">YOU</span>` : ``}
        ${
          // Host sees kick buttons next to everyone except themselves
          hostIsMe && !isHostRow
            ? `<button class="kickBtn" data-kick="${escapeHtml(p.id)}">KICK</button>`
            : ``
        }
      </div>
    `;

    playersList.appendChild(row);
  }
}

/* ================================
   PARTY SUBSCRIPTIONS
================================ */
function unsubscribeAll() {
  if (unsubParty) unsubParty();
  if (unsubPlayers) unsubPlayers();
  unsubParty = null;
  unsubPlayers = null;
}

function goHomeHard() {
  unsubscribeAll();
  partyCode = null;
  playerName = null;
  isHost = false;
  lastPartyData = null;
  setView("home");
}

function subscribeToParty(code) {
  unsubscribeAll();

  partyCode = code;
  if (partyCodeText) partyCodeText.textContent = code;

  unsubParty = onSnapshot(partyRef(code), async (snap) => {
    if (!snap.exists()) {
      showToast("Party not found (it may have been closed).");
      goHomeHard();
      return;
    }

    const data = snap.data();

    // If this client was kicked, notify and return them to home
if (playerId && data?.kicked && data.kicked[playerId]) {
  showToast("You have been kicked from the party.");
  goHomeHard();
  return;
}

    if (useDefaultBankToggle) useDefaultBankToggle.checked = data.useDefaultBank !== false; // default true
applyBankUI();

// Sync host toggle UI from party doc (safe for host and non-host; hostPanel hides anyway)
if (hintToggle) hintToggle.checked = !!data.hintEnabled;
if (hintOnlyIfImposterStartsToggle) hintOnlyIfImposterStartsToggle.checked = !!data.hintOnlyIfImposterStarts;
applyHintToggleLock();

    lastPartyData = data;
    applyHostUI(data);

    // hide legacy word controls if present
    if (wordInput) wordInput.parentElement?.classList?.add?.("hidden");
    if (randomWordBtn) randomWordBtn.classList.add("hidden");

    const isHostLocal = !!playerId && data.hostUid === playerId;
const shouldStayLobby = isHostLocal && lobbyOverride && data.started;

if (data.started && !shouldStayLobby) {
  setView("game");
  renderGame(data);
} else {
  setView("lobby");
  if (revealBox) revealBox.classList.add("hidden");

  // reset cover state
  currentRealWord = "---";
  if (wordDisplay) {
    wordDisplay.textContent = currentRealWord;
    wordDisplay.setAttribute("data-word", currentRealWord);
  }
  coverWord();
  
  updateRoleTag(false, false);
}
  });

  unsubPlayers = onSnapshot(playersRef(code), async (snap) => {
    const players = snap.docs.map(d => d.data()).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    const partySnap = await getDoc(partyRef(code));
    if (!partySnap.exists()) return;
    renderPlayers(players, partySnap.data().hostUid);
  });

  // force a UI refresh (helps when snapshot ran before auth uid existed)
  refreshPartyUI().catch(() => {});
}

/* ================================
   GAME RENDER
================================ */
function renderGame(party) {
  setRevealButtonVisible(isHost);
  const isImposterLocal = party.imposterId === playerId;

  // Hide role initially
  updateRoleTag(isImposterLocal, false);

  // Store the real word for THIS player
  currentRealWord = isImposterLocal ? "IMPOSTER" : (party.word || "---");

    // ✅ Hint logic (compute now, but DON'T show until tap-to-reveal)
  currentHintShouldShow = false;
  currentHintText = party.wordHint || "No hint provided.";

  if (party.hintEnabled && isImposterLocal) {
    if (party.hintOnlyIfImposterStarts) {
      // only show hint if the imposter is also the first player
      currentHintShouldShow = party.firstPlayerId === party.imposterId;
    } else {
      currentHintShouldShow = true;
    }
  }

  // IMPORTANT: hide hint by default when entering the game screen
  setHintBoxVisible(false);

  // Set it, then cover
  if (wordDisplay) {
    wordDisplay.textContent = currentRealWord;
    wordDisplay.setAttribute("data-word", currentRealWord);
  }
  coverWord();

  // First player name
  if (party.firstPlayerId && firstPlayerName) {
    getDoc(playerDocRef(partyCode, party.firstPlayerId)).then(s => {
      firstPlayerName.textContent = s.exists() ? s.data().name : "---";
    });
  } else if (firstPlayerName) {
    firstPlayerName.textContent = "---";
  }

  // Reveal box
  if (!revealBox) return;

  if (party.revealed) {
    revealBox.classList.remove("hidden");
    if (party.imposterId && imposterNameReveal) {
      getDoc(playerDocRef(partyCode, party.imposterId)).then(s => {
        imposterNameReveal.textContent = s.exists() ? s.data().name : "UNKNOWN";
      });
    } else if (imposterNameReveal) {
      imposterNameReveal.textContent = "UNKNOWN";
    }
  } else {
    revealBox.classList.add("hidden");
  }
}

/* ================================
   ACTIONS
================================ */

// Create party (host also plays)
createPartyBtn?.addEventListener("click", async () => {
  try {
    const name = (hostName?.value || "").trim();
    if (!name) return showToast("Enter your name.");

    await ensureAuth();
    playerName = name;

    let code = makeCode(5);
    for (let i = 0; i < 6; i++) {
      const s = await getDoc(partyRef(code));
      if (!s.exists()) break;
      code = makeCode(5);
    }

   const party = {
  code,
  hostUid: playerId,
  createdAt: Date.now(),
  started: false,
  revealed: false,
  word: "",
  wordHint: "",
  imposterId: "",
  firstPlayerId: "",
  useDefaultBank: true,
  hintEnabled: false,
  hintOnlyIfImposterStarts: false,

  // NEW: fairness memory (persists across rounds)
  roundNumber: 0,
  imposterStats: {},     // { [playerId]: { lastRound: number, count: number } }
  firstPlayerStats: {}   // { [playerId]: { lastRound: number, count: number } }
};

    await setDoc(partyRef(code), party);

    // host joins as player (doc id = uid)
    await setSubDoc(playerDocRef(code, playerId), {
      id: playerId,
      name: playerName,
      joinedAt: Date.now()
    });

    showToast("Party created!");
    subscribeToParty(code);
  } catch (e) {
    console.error("Create party failed:", e);
    showToast(e?.message || "Create party failed");
  }
});

// Join party
joinPartyBtn?.addEventListener("click", async () => {
  try {
    const code = cleanCode(joinCode?.value);
    const name = (joinName?.value || "").trim();
    if (!code) return showToast("Enter a party code.");
    if (!name) return showToast("Enter your name.");

    await ensureAuth();
    playerName = name;

    const p = await getDoc(partyRef(code));
    if (!p.exists()) return showToast("That party code doesn't exist.");

    const partyData = p.data() || {};

    // ✅ IMPORTANT: clear my own kick flag BEFORE joining
    if (partyData.kicked && partyData.kicked[playerId]) {
      await updateDoc(partyRef(code), {
        [`kicked.${playerId}`]: deleteField()
      });
    }

    if (partyData.started) return showToast("Game already started. Ask host to reset.");

    await setSubDoc(playerDocRef(code, playerId), {
      id: playerId,
      name: playerName,
      joinedAt: Date.now()
    });

    showToast("Joined party!");
    subscribeToParty(code);
  } catch (e) {
    console.error("Join party failed:", e);
    showToast(e?.message || "Join party failed");
  }
});

// Copy code
copyCodeBtn?.addEventListener("click", async () => {
  if (!partyCode) return;
  await navigator.clipboard.writeText(partyCode);
  showToast("Code copied!");
});

// Leave (host deletes party; others delete themselves)
leaveBtn?.addEventListener("click", async () => {
  try {
    if (!partyCode || !playerId) return goHomeHard();

    const p = await getDoc(partyRef(partyCode));
    if (p.exists() && p.data().hostUid === playerId) {
      await deleteDoc(partyRef(partyCode));
    } else {
      await deleteDoc(playerDocRef(partyCode, playerId));
    }

    goHomeHard();
  } catch (e) {
    console.error("Leave failed:", e);
    showToast(e?.message || "Leave failed");
  }
});

// Host start game (word always random)
startGameBtn?.addEventListener("click", async () => {
  try {
    if (!partyCode) return;

    const p = await getDoc(partyRef(partyCode));
    if (!p.exists()) return;

    if (p.data().hostUid !== playerId) return showToast("Only the host can start.");

    const { getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const snap = await getDocs(playersRef(partyCode));
    const players = snap.docs.map(d => d.data());

    if (players.length < 3) return showToast("Need at least 3 players.");

    // Build the bank from textarea (host-only convenience). If empty/invalid, fall back.
// Decide which bank to use (default toggle ON uses built-in list)
const useDefault = !!useDefaultBankToggle?.checked;

// Host: start a new round WITHOUT going back to lobby (keeps fairness + recency)
startNewRoundBtn?.addEventListener("click", async () => {
  try {
    if (!partyCode) return;

    const p = await getDoc(partyRef(partyCode));
    if (!p.exists()) return;

    const partyData = p.data() || {};
    if (partyData.hostUid !== playerId) return showToast("Only the host can start a new round.");

    // Pull players
    const { getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const snap = await getDocs(playersRef(partyCode));
    const players = snap.docs.map(d => d.data()).filter(Boolean);

    if (players.length < 3) return showToast("Need at least 3 players.");

    // Bank: use saved setting from party doc (fallback to current toggle)
    const useDefault = (partyData.useDefaultBank !== false); // default true
    let bank = WORD_BANK;

    if (!useDefault) {
      const customBank = parseWordBank(wordBankInput?.value || "");
      if (customBank.length) bank = customBank;
    }

    // Word with recency
    const recentWords = partyData.recentWords || [];
    const seed = (partyData.createdAt || Date.now()) + Date.now();
    const pick = pickWordWithRecency(bank, recentWords, seed);
    const word = pick.word;
    const wordHint = pick.hint || "";

    const nextRecentWords = [word, ...recentWords.filter(w => w !== word)].slice(0, 25);

    // Fairness stats (persisted)
    const nextRound = (partyData.roundNumber || 0) + 1;
    const imposterStats = partyData.imposterStats || {};
    const firstPlayerStats = partyData.firstPlayerStats || {};

    const imposter = weightedPick(players, (pl) => {
      const st = imposterStats[pl.id] || {};
      const wasLastRound = (st.lastRound || 0) === (nextRound - 1);
      return computeWeight({
        roundNum: nextRound,
        lastRound: st.lastRound || 0,
        count: st.count || 0,
        wasLastRound
      });
    });

    const first = weightedPick(players, (pl) => {
      const st = firstPlayerStats[pl.id] || {};
      const wasLastRound = (st.lastRound || 0) === (nextRound - 1);
      return computeWeight({
        roundNum: nextRound,
        lastRound: st.lastRound || 0,
        count: st.count || 0,
        wasLastRound
      });
    });

    // Update stats
    const impSt = imposterStats[imposter.id] || { lastRound: 0, count: 0 };
    imposterStats[imposter.id] = { lastRound: nextRound, count: (impSt.count || 0) + 1 };

    const fpSt = firstPlayerStats[first.id] || { lastRound: 0, count: 0 };
    firstPlayerStats[first.id] = { lastRound: nextRound, count: (fpSt.count || 0) + 1 };

    // Keep game "started" so everyone stays in game view
    lobbyOverride = false;

    await updateDoc(partyRef(partyCode), {
      started: true,
      revealed: false,
      word,
      wordHint,
      imposterId: imposter.id,
      firstPlayerId: first.id,

      // Keep the current settings from the party doc
      hintEnabled: !!partyData.hintEnabled,
      hintOnlyIfImposterStarts: !!partyData.hintOnlyIfImposterStarts,
      useDefaultBank: !!useDefault,

      // Persisted memory
      roundNumber: nextRound,
      imposterStats,
      firstPlayerStats,
      recentWords: nextRecentWords
    });

    showToast("New round started!");
  } catch (e) {
    console.error("Start new round failed:", e);
    showToast(e?.message || "Start new round failed");
  }
});

let bank = WORD_BANK;

if (!useDefault) {
  const customBank = parseWordBank(wordBankInput?.value || "");
  if (customBank.length) bank = customBank;
}

const partyData = p.data() || {};
const recentWords = partyData.recentWords || [];

const seed = (partyData.createdAt || Date.now()) + Date.now();

const pick = pickWordWithRecency(bank, recentWords, seed);
const word = pick.word;
const wordHint = pick.hint || "";

// keep last 25 used words
const nextRecentWords = [word, ...recentWords.filter(w => w !== word)].slice(0, 25);
    // ===== NEW: weighted imposter + weighted first player (both with tiny chaos) =====
const nextRound = (partyData.roundNumber || 0) + 1;

// pull existing stats (or default)
const imposterStats = partyData.imposterStats || {};
const firstPlayerStats = partyData.firstPlayerStats || {};

// build a stable list of player ids
const ids = players.map(pl => pl.id).filter(Boolean);

// pick imposter (weighted)
const imposter = weightedPick(players, (pl) => {
  const st = imposterStats[pl.id] || {};
  const wasLastRound = (st.lastRound || 0) === (nextRound - 1);
  return computeWeight({
    roundNum: nextRound,
    lastRound: st.lastRound || 0,
    count: st.count || 0,
    wasLastRound
  });
});

// pick first player (weighted) — independent from imposter (can be same person)
const first = weightedPick(players, (pl) => {
  const st = firstPlayerStats[pl.id] || {};
  const wasLastRound = (st.lastRound || 0) === (nextRound - 1);
  return computeWeight({
    roundNum: nextRound,
    lastRound: st.lastRound || 0,
    count: st.count || 0,
    wasLastRound
  });
});

// update stats
const impSt = imposterStats[imposter.id] || { lastRound: 0, count: 0 };
imposterStats[imposter.id] = { lastRound: nextRound, count: (impSt.count || 0) + 1 };

const fpSt = firstPlayerStats[first.id] || { lastRound: 0, count: 0 };
firstPlayerStats[first.id] = { lastRound: nextRound, count: (fpSt.count || 0) + 1 };

// start game
lobbyOverride = false;

await updateDoc(partyRef(partyCode), {
  started: true,
  revealed: false,
  word,
  wordHint,
  imposterId: imposter.id,
  firstPlayerId: first.id,

  hintEnabled: !!hintToggle?.checked,
  hintOnlyIfImposterStarts: !!hintOnlyIfImposterStartsToggle?.checked,
  useDefaultBank: !!useDefaultBankToggle?.checked,

  // NEW persisted memory
  roundNumber: nextRound,
  imposterStats,
  firstPlayerStats,
  recentWords: nextRecentWords,
});

    showToast("Game started!");
  } catch (e) {
    console.error("Start game failed:", e);
    showToast(e?.message || "Start failed (check Firestore rules)");
  }
});

// Host reveal results
showResultsBtn?.addEventListener("click", async () => {
  try {
    if (!partyCode) return;

    const p = await getDoc(partyRef(partyCode));
    if (!p.exists()) return;

    if (p.data().hostUid !== playerId) return showToast("Only the host can reveal.");

    await updateDoc(partyRef(partyCode), { revealed: true });
    showToast("Revealed!");
  } catch (e) {
    console.error("Reveal failed:", e);
    showToast(e?.message || "Reveal failed");
  }
});

// Host reset round
resetPartyBtn?.addEventListener("click", async () => {
  try {
    if (!partyCode) return;

    const p = await getDoc(partyRef(partyCode));
    if (!p.exists()) return;

    if (p.data().hostUid !== playerId) return showToast("Only the host can reset.");

    lobbyOverride = false;
    await updateDoc(partyRef(partyCode), {
      started: false,
      revealed: false,
      word: "",
      imposterId: "",
      firstPlayerId: ""
    });

    showToast("Round reset.");
    setView("lobby");
  } catch (e) {
    console.error("Reset failed:", e);
    showToast(e?.message || "Reset failed");
  }
});

// Back to lobby (UI only)
backToLobbyBtn?.addEventListener("click", () => {
  // Host can temporarily stay in lobby to change switches
  lobbyOverride = true;
  setView("lobby");
});

// Home button
homeBtn?.addEventListener("click", () => {
  if (partyCode) return showToast("Leave party to return home.");
  setView("home");
});

/* ================================
   INITIAL
================================ */
applyBankUI();
setView("home");