// ====== Configuration ======
const serverUrl = "wss://lls-server-production-cde6.up.railway.app";

// ====== DOM Elements ======
const landing = document.getElementById("landing");
const lobbyDiv = document.getElementById("lobby");
const playerListDiv = document.getElementById("playerList");
const lobbyCodeSpan = document.getElementById("lobbyCode");
const usernameInput = document.getElementById("usernameInput");
const joinCodeInput = document.getElementById("joinCodeInput");
// const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
// const playBtn = document.getElementById("playBtn");
const leaveBtn = document.getElementById("leaveBtn");
const controlsDiv = document.getElementById("controls");
const buttonA = document.getElementById("buttonA");
const buttonB = document.getElementById("buttonB");

// ====== State ======
let ws = null;
let playerId = null;
let currentLobby = null;
let holdIntervalA = null;
let holdIntervalB = null;

// ====== WebSocket Handlers ======
function setupWSHandlers() {
  if (!ws) return;

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "LOBBY_CREATED" || data.type === "LOBBY_JOINED") {
      playerId = data.playerId;
      currentLobby = data.lobbyId;
      lobbyCodeSpan.textContent = currentLobby;
      landing.style.display = "none";
      lobbyDiv.style.display = "block";
      controlsDiv.style.display = "block";
      console.log(`Joined lobby ${currentLobby}`);
    }

    if (data.type === "LOBBY_STATE") {
      if (!currentLobby) return; // Only show lobby if player has joined
      playerListDiv.innerHTML = data.players.map(p => `<div>${p.username} (${p.playerId})</div>`).join("");
    }

    if (data.type === "ERROR") {
      alert(data.message);
    }
  };

  ws.onclose = () => console.log("Disconnected from server");
}

// ====== Send Message ======
function sendMessage(obj) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(obj));
}

// ====== Lobby Actions ======
function createLobby(username) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ws = new WebSocket(serverUrl);
    ws.onopen = () => sendMessage({ type: "CREATE", username });
    setupWSHandlers();
  } else {
    sendMessage({ type: "CREATE", username });
  }
}

function joinLobby(username, code) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ws = new WebSocket(serverUrl);
    ws.onopen = () => sendMessage({ type: "JOIN_CODE", username, code });
    setupWSHandlers();
  } else {
    sendMessage({ type: "JOIN_CODE", username, code });
  }
}

function autoJoinLobby(username) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ws = new WebSocket(serverUrl);
    ws.onopen = () => sendMessage({ type: "AUTOJOIN", username });
    setupWSHandlers();
  } else {
    sendMessage({ type: "AUTOJOIN", username });
  }
}

// ====== Button Listeners ======
// createBtn.addEventListener("click", () => {
//   const username = usernameInput.value.trim().slice(0,12) || "Player";
//   createLobby(username);
// });

joinBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim().slice(0,12) || "Player";
  const code = joinCodeInput.value.trim();
  if (!code) return alert("Enter a lobby code");
  joinLobby(username, code);
});

// playBtn.addEventListener("click", () => {
//   const username = usernameInput.value.trim().slice(0,12) || "Player";
//   autoJoinLobby(username);
// });

leaveBtn.addEventListener("click", () => {
  sendMessage({ type: "LEAVE", playerId });
  playerId = null;
  currentLobby = null;
  lobbyDiv.style.display = "none";
  controlsDiv.style.display = "none";
  landing.style.display = "block";
});

// ====== Input Handling ======
function sendInput(action) {
  if (!ws || ws.readyState !== WebSocket.OPEN || !playerId) return;
  ws.send(JSON.stringify({ type: "INPUT", playerId, action }));
}

// Setup A/B buttons with hold
function setupButtons() {
  // Button A
  buttonA.addEventListener("mousedown", () => { sendInput("A"); holdIntervalA = setInterval(() => sendInput("A"), 100); });
  buttonA.addEventListener("mouseup", () => clearInterval(holdIntervalA));
  buttonA.addEventListener("mouseleave", () => clearInterval(holdIntervalA));
  buttonA.addEventListener("touchstart", (e) => { e.preventDefault(); sendInput("A"); holdIntervalA = setInterval(() => sendInput("A"), 100); });
  buttonA.addEventListener("touchend", () => clearInterval(holdIntervalA));

  // Button B
  buttonB.addEventListener("mousedown", () => { sendInput("B"); holdIntervalB = setInterval(() => sendInput("B"), 100); });
  buttonB.addEventListener("mouseup", () => clearInterval(holdIntervalB));
  buttonB.addEventListener("mouseleave", () => clearInterval(holdIntervalB));
  buttonB.addEventListener("touchstart", (e) => { e.preventDefault(); sendInput("B"); holdIntervalB = setInterval(() => sendInput("B"), 100); });
  buttonB.addEventListener("touchend", () => clearInterval(holdIntervalB));
}

// Initialize buttons once
setupButtons();
