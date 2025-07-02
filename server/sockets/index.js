const socketIo = require('socket.io');

// Predefined cricket players (20 players)
const ALL_PLAYERS = [
  { id: 1, name: 'Virat Kohli' },
  { id: 2, name: 'Rohit Sharma' },
  { id: 3, name: 'MS Dhoni' },
  { id: 4, name: 'Sachin Tendulkar' },
  { id: 5, name: 'Sourav Ganguly' },
  { id: 6, name: 'Anil Kumble' },
  { id: 7, name: 'Kapil Dev' },
  { id: 8, name: 'Rahul Dravid' },
  { id: 9, name: 'VVS Laxman' },
  { id: 10, name: 'Yuvraj Singh' },
  { id: 11, name: 'Hardik Pandya' },
  { id: 12, name: 'Jasprit Bumrah' },
  { id: 13, name: 'Ravindra Jadeja' },
  { id: 14, name: 'Bhuvneshwar Kumar' },
  { id: 15, name: 'Shikhar Dhawan' },
  { id: 16, name: 'KL Rahul' },
  { id: 17, name: 'Shreyas Iyer' },
  { id: 18, name: 'Rishabh Pant' },
  { id: 19, name: 'Mohammed Shami' },
  { id: 20, name: 'Ishant Sharma' }
];

// In-memory storage for rooms
const rooms = new Map();

function registerSocketHandlers(server) {
  const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on('create-room', (username) => createRoom(io, socket, username));
    socket.on('join-room', (data) => joinRoom(io, socket, data));
    socket.on('start-selection', (roomId) => startSelection(io, socket, roomId));
    socket.on('select-player', (data) => selectPlayer(io, socket, data));
    socket.on('disconnect', () => handleDisconnect(socket, io));
  });
}

// Helper: generate unique 5-char room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// Helper: shuffle an array
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function createRoom(io, socket, username) {
  const roomId = generateRoomId();
  rooms.set(roomId, {
    host: socket.id,
    users: new Map([[socket.id, { username, players: [] }]]),
    status: 'waiting',
    availablePlayers: [...ALL_PLAYERS],
    turnOrder: [],
    currentTurnIndex: 0,
    timer: null
  });

  socket.join(roomId);
  socket.emit('room-created', { roomId, username });
  console.log(`Room created: ${roomId} by ${username}`);
}

function joinRoom(io, socket, data) {
  const { roomId, username } = data;
  const room = rooms.get(roomId);
  if (!room || room.status !== 'waiting') {
    socket.emit('error', { message: 'Invalid room or game already started' });
    return;
  }

  room.users.set(socket.id, { username, players: [] });
  socket.join(roomId);
  socket.emit('room-joined', { roomId, username, host: room.host });
  socket.to(roomId).emit('user-joined', { userId: socket.id, username });

  console.log(`${username} joined room ${roomId}`);
}

function startSelection(io, socket, roomId) {
  const room = rooms.get(roomId);
  if (!room || socket.id !== room.host) return;

  room.turnOrder = shuffleArray(Array.from(room.users.keys()));
  room.status = 'selection';
  room.currentTurnIndex = 0;

  io.to(roomId).emit('selection-started', {
    turnOrder: room.turnOrder.map(id => ({ userId: id, username: room.users.get(id).username }))
  });

  startTurnTimer(io, roomId);
  console.log(`Selection started in room ${roomId}`);
}

function selectPlayer(io, socket, data) {
  const { roomId, playerId } = data;
  const room = rooms.get(roomId);
  if (!room || room.status !== 'selection') return;

  const currentUserId = room.turnOrder[room.currentTurnIndex];
  if (socket.id !== currentUserId) return;

  processSelection(io, roomId, playerId, false);
}

function startTurnTimer(io, roomId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'selection') return;

  if (room.timer) clearTimeout(room.timer);

  const currentUserId = room.turnOrder[room.currentTurnIndex];
  io.to(roomId).emit('turn-update', { currentUserId, timeLeft: 10 });

  room.timer = setTimeout(() => {
    const randomPlayer = room.availablePlayers[Math.floor(Math.random() * room.availablePlayers.length)];
    processSelection(io, roomId, randomPlayer.id, true);
  }, 10000);
}

function processSelection(io, roomId, playerId, isAuto) {
  const room = rooms.get(roomId);
  const currentUserId = room.turnOrder[room.currentTurnIndex];
  const user = room.users.get(currentUserId);

  const idx = room.availablePlayers.findIndex(p => p.id === playerId);
  if (idx === -1) return;

  const [player] = room.availablePlayers.splice(idx, 1);
  user.players.push(player);

  io.to(roomId).emit('player-selected', { userId: currentUserId, username: user.username, player, isAuto });

  const allDone = Array.from(room.users.values()).every(u => u.players.length === 5);
  if (allDone) {
    room.status = 'ended';
    io.to(roomId).emit('selection-ended', {
      teams: Array.from(room.users.entries()).map(([id, u]) => ({ userId: id, username: u.username, players: u.players }))
    });
    return;
  }

  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
  startTurnTimer(io, roomId);
}

function handleDisconnect(socket, io) {
  console.log(`Disconnected: ${socket.id}`);
  // Optional: cleanup empty rooms or notify others
}

module.exports = { registerSocketHandlers };