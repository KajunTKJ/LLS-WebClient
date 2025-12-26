const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });

const lobbies = {}; // { lobbyId: { id, players: [{ socket, playerId, username }] } }

console.log("LLS WebSocket server running on port 8080");

// Utility: broadcast lobby state
function broadcastLobbyState(lobby) {
  const state = {
    type: "LOBBY_STATE",
    lobbyId: lobby.id,
    players: lobby.players.map(p => ({ playerId: p.playerId, username: p.username }))
  };
  lobby.players.forEach(p => p.socket.send(JSON.stringify(state)));
}

// Create a new lobby
function createLobby() {
  let id;
  do {
    id = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4-char alphanumeric
  } while (lobbies[id]);
  lobbies[id] = { id, players: [] };
  return lobbies[id];
}

wss.on('connection', (socket) => {
  const playerId = uuidv4(); // unique per connection
  let currentLobby = null;

  console.log(`Player connected: ${playerId}`);

  socket.on('message', (message) => {
    let msg;
    try { msg = JSON.parse(message); } 
    catch(e) { return socket.send(JSON.stringify({ type: "ERROR", message: "Invalid JSON" })); }

    const username = (msg.username || playerId).toString().slice(0,12);

    // CREATE lobby
    if (msg.type === "CREATE") {
      currentLobby = createLobby();
      currentLobby.players.push({ socket, playerId, username });

      socket.send(JSON.stringify({
        type: "LOBBY_CREATED",
        lobbyId: currentLobby.id,
        playerId,
        playerCount: currentLobby.players.length
      }));

      console.log(`${playerId} created ${currentLobby.id}`);
      broadcastLobbyState(currentLobby);
    }

    // JOIN_CODE
    else if (msg.type === "JOIN_CODE") {
      const lobby = lobbies[msg.code];
      if (!lobby || lobby.players.length >= 4) {
        socket.send(JSON.stringify({ type: "ERROR", message: "Invalid or full lobby" }));
        return;
      }
      currentLobby = lobby;
      currentLobby.players.push({ socket, playerId, username });

      socket.send(JSON.stringify({
        type: "LOBBY_JOINED",
        lobbyId: currentLobby.id,
        playerId,
        playerCount: currentLobby.players.length
      }));

      console.log(`${playerId} joined ${currentLobby.id}`);
      broadcastLobbyState(currentLobby);
    }

    // LEAVE
    else if (msg.type === "LEAVE") {
      if (!currentLobby) return;
      currentLobby.players = currentLobby.players.filter(p => p.playerId !== playerId);
      console.log(`${playerId} left ${currentLobby.id}`);

      broadcastLobbyState(currentLobby);

      // delete lobby if empty
      if (currentLobby.players.length === 0) delete lobbies[currentLobby.id];
      currentLobby = null;
    }

    // INPUT (A/B)
    else if (msg.type === "INPUT") {
      console.log(`Player ${msg.playerId} pressed ${msg.action}`);
      // TODO: forward to Unity or handle game logic
    }
  });

  socket.on('close', () => {
    if (currentLobby) {
      currentLobby.players = currentLobby.players.filter(p => p.playerId !== playerId);
      console.log(`${playerId} disconnected from ${currentLobby.id}`);
      broadcastLobbyState(currentLobby);
      if (currentLobby.players.length === 0) delete lobbies[currentLobby.id];
    }
  });
});
