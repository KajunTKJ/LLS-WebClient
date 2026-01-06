// --------------------
// WebSocket Setup
// --------------------

const SERVER_URL = "wss://lls-server-production-cde6.up.railway.app";
let ws = null;

// --------------------
// UI References
// --------------------

const landingUI = document.getElementById("landing");
const lobbyUI = document.getElementById("lobby");

const joinBtn = document.getElementById("joinBtn");
const createBtn = document.getElementById("createBtn");

const codeInput = document.getElementById("codeInput");
const usernameInput = document.getElementById("usernameInput");

const lobbyCodeText = document.getElementById("lobbyCode");
const playerIdText = document.getElementById("playerId");
const statusText = document.getElementById("status");

// --------------------
// Client State
// --------------------

let currentLobbyId = null;
let currentPlayerId = null;

// --------------------
// Connect to Server
// --------------------

function connect() {
  ws = new WebSocket(SERVER_URL);

  ws.onopen = () => {
    console.log("Connected to server");
    statusText.textContent = "Connected";
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log("Server:", msg);

    handleServerMessage(msg);
  };

  ws.onclose = () => {
    console.log("Disconnected");
    statusText.textContent = "Disconnected";
    showLanding();
  };
}

connect();

// --------------------
// Message Handler
// --------------------

function handleServerMessage(msg) {
  switch (msg.type) {

    case "JOIN_SUCCESS":
      currentLobbyId = msg.lobbyId;
      currentPlayerId = msg.playerId;
      showLobby();
      break;

    case "LOBBY_CREATED":
      currentLobbyId = msg.lobbyId;
      showLobby(true);
      break;

    case "ERROR":
      alert(msg.message);
      break;

    case "LOBBY_CLOSED":
      alert("Lobby closed");
      resetState();
      break;
  }
}

// --------------------
// UI Transitions
// --------------------

function showLobby(isHost = false) {
  landingUI.style.display = "none";
  lobbyUI.style.display = "block";

  lobbyCodeText.textContent = currentLobbyId;
  playerIdText.textContent = isHost ? "HOST" : currentPlayerId;
}

function showLanding() {
  landingUI.style.display = "block";
  lobbyUI.style.display = "none";
}

function resetState() {
  currentLobbyId = null;
  currentPlayerId = null;
  showLanding();
}

// --------------------
// Button Actions
// --------------------

joinBtn.onclick = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const code = codeInput.value.trim().toUpperCase();
  const username = usernameInput.value.trim().substring(0, 12);

  if (!code || !username) {
    alert("Enter lobby code and username");
    return;
  }

  ws.send(JSON.stringify({
    type: "JOIN_CODE",
    code,
    username
  }));
};

createBtn.onclick = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(JSON.stringify({
    type: "CREATE"
  }));
};
