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
  deleteDoc
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
const WORDS = [
  "ELEPHANT","PIZZA","SPACESHIP","SNOWMAN","VOLCANO","GUITAR",
  "CASTLE","JELLYFISH","ROLLERCOASTER","DRAGON","SUNFLOWER","SUBMARINE"
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

// legacy word controls (might not exist)
const wordInput = $("wordInput");
const randomWordBtn = $("randomWordBtn");

const timerInput = $("timerInput");
const startGameBtn = $("startGameBtn");
const showResultsBtn = $("showResultsBtn");
const resetPartyBtn = $("resetPartyBtn");

const roleTag = $("roleTag");
const wordDisplay = $("wordDisplay");
const firstPlayerName = $("firstPlayerName");
const timerDisplay = $("timerDisplay");
const revealBox = $("revealBox");
const imposterNameReveal = $("imposterNameReveal");
const backToLobbyBtn = $("backToLobbyBtn");

const toast = $("toast");
const homeBtn = $("homeBtn");

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
  // If we don't have auth uid yet, don't decide host
  if (!data || !playerId) {
    isHost = false;
    if (hostPanel) hostPanel.style.display = "none";
    if (showResultsBtn) showResultsBtn.disabled = true;
    return;
  }

  isHost = data.hostUid === playerId;
  if (hostPanel) hostPanel.style.display = isHost ? "block" : "none";

  // enabled only when host + started + not revealed yet
  if (showResultsBtn) {
    showResultsBtn.disabled = !(isHost && data.started && !data.revealed);
  }

  // Optional debug (safe):
  console.log("HOST CHECK:", { playerId, hostUid: data.hostUid, isHost, started: data.started, revealed: data.revealed });
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

function coverWord() {
  if (!wordDisplay) return;
  wordDisplay.classList.add("wordCovered");
  wordDisplay.classList.remove("wordRevealFlash");
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
  wordDisplay.classList.add("wordRevealFlash");

  clearTimeout(hideWordTimer);
  hideWordTimer = setTimeout(() => {
    coverWord();
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

  playersList.innerHTML = "";
  for (const p of players) {
    const row = document.createElement("div");
    row.className = "player";
    row.innerHTML = `
      <div>
        <div style="font-weight:800;">${escapeHtml(p.name)}</div>
        <div style="color:#94a3b8;font-size:12px;">${escapeHtml((p.id || "").slice(0, 6))}</div>
      </div>
      <div>
        ${p.id === hostUid ? `<span class="badge">HOST</span>` : ``}
        ${p.id === playerId ? `<span class="badge" style="margin-left:8px;background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.12)">YOU</span>` : ``}
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
    lastPartyData = data;
    applyHostUI(data);

    // hide legacy word controls if present
    if (wordInput) wordInput.parentElement?.classList?.add?.("hidden");
    if (randomWordBtn) randomWordBtn.classList.add("hidden");

    if (data.started) {
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
  const isImposterLocal = party.imposterId === playerId;

  // Hide role initially
  updateRoleTag(isImposterLocal, false);

  // Store the real word for THIS player
  currentRealWord = isImposterLocal ? "IMPOSTER" : (party.word || "---");

  // Set it, then cover
  if (wordDisplay) {
    wordDisplay.textContent = currentRealWord;
    wordDisplay.setAttribute("data-word", currentRealWord);
  }
  coverWord();

  if (timerDisplay) timerDisplay.textContent = String(party.timerSec ?? 60);

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
      imposterId: "",
      firstPlayerId: "",
      timerSec: 60
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
    if (p.data().started) return showToast("Game already started. Ask host to reset.");

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

    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const imposter = players[Math.floor(Math.random() * players.length)];

    let first = players[Math.floor(Math.random() * players.length)];
    if (!first) first = players[0];

    const timerSec = Math.max(10, Math.min(300, Number(timerInput?.value || 60)));

    await updateDoc(partyRef(partyCode), {
      started: true,
      revealed: false,
      word,
      imposterId: imposter.id,
      firstPlayerId: first.id,
      timerSec
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
backToLobbyBtn?.addEventListener("click", () => setView("lobby"));

// Home button
homeBtn?.addEventListener("click", () => {
  if (partyCode) return showToast("Leave party to return home.");
  setView("home");
});

/* ================================
   INITIAL
================================ */
setView("home");