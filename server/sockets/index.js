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

// In-memory storage for rooms: key = roomId, value = { host, users, status, availablePlayers, turnOrder, currentTurnIndex, timer }
const rooms = new Map();

function registerSocketHandlers(server) {
  const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET','POST'] }
  });

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Create room
    socket.on('create-room', (username) => {
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
      // inform creator
      socket.emit('room-created', { roomId, hostId: socket.id });
      // broadcast full user list
      io.to(roomId).emit('user-list', getUserList(roomId));
      console.log(`Room ${roomId} created by ${username}`);
    });

    // Join room
    socket.on('join-room', ({ roomId, username }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'waiting') {
        socket.emit('error', { message: 'Invalid room or already started' });
        return;
      }
      room.users.set(socket.id, { username, players: [] });
      socket.join(roomId);
      // confirm join
      socket.emit('room-joined', { roomId, hostId: room.host });
      // broadcast updated user list
      io.to(roomId).emit('user-list', getUserList(roomId));
      console.log(`${username} joined room ${roomId}`);
    });

    // Send available players
    socket.on('get-players', (roomId) => {
      const room = rooms.get(roomId);
      if (room) socket.emit('player-list', room.availablePlayers);
    });

    // Start selection (only host)
    socket.on('start-selection', (roomId) => {
      const room = rooms.get(roomId);
      if (!room || socket.id !== room.host) return;
      room.status = 'selection';
      room.turnOrder = shuffleArray([...room.users.keys()]);
      room.currentTurnIndex = 0;
      // notify start and turn order
      io.to(roomId).emit('selection-started', {
        turnOrder: room.turnOrder.map(id => ({ userId: id, username: room.users.get(id).username })),
        currentUserId: room.turnOrder[0]
      });
      advanceTurn(io, roomId);
      console.log(`Selection in room ${roomId} started`);
    });

    // Player selects
    socket.on('select-player', ({ roomId, playerId }) => {
      processSelection(io, roomId, socket.id, playerId, false);
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          io.to(roomId).emit('user-list', getUserList(roomId));
          console.log(`Removed ${socket.id} from room ${roomId}`);
        }
      });
    });
  });
}

// Helpers
function generateRoomId() {
  return Math.random().toString(36).slice(2,7).toUpperCase();
}
function shuffleArray(arr) {
  return arr.sort(() => Math.random()-0.5);
}
function getUserList(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.users.entries()).map(([id, u]) => ({ userId: id, username: u.username, isHost: id===room.host }));
}

function advanceTurn(io, roomId) {
  const room = rooms.get(roomId);
  if (!room || room.status!=='selection') return;
  if (room.timer) clearTimeout(room.timer);
  const currentUserId = room.turnOrder[room.currentTurnIndex];
  io.to(roomId).emit('turn-update', { currentUserId, timeLeft: 10 });
  room.timer = setTimeout(() => {
    const roomRef = rooms.get(roomId);
    if (!roomRef || !roomRef.availablePlayers.length) return;
    const rand = roomRef.availablePlayers[Math.floor(Math.random()*roomRef.availablePlayers.length)];
    processSelection(io, roomId, currentUserId, rand.id, true);
  },10000);
}

function processSelection(io, roomId, userId, playerId, isAuto) {
  const room = rooms.get(roomId);
  if (!room || room.status!=='selection') return;
  const current = room.turnOrder[room.currentTurnIndex];
  if (userId!==current) return;  // not this user's turn
  const idx = room.availablePlayers.findIndex(p=>p.id===playerId);
  if (idx<0) return;
  const [player] = room.availablePlayers.splice(idx,1);
  room.users.get(userId).players.push(player);
  io.to(roomId).emit('player-selected',{ userId, username: room.users.get(userId).username, player, isAuto });
  // next
  const done = Array.from(room.users.values()).every(u=>u.players.length===5);
  if (done) {
    io.to(roomId).emit('selection-ended',{ teams: getUserList(roomId).map(u=>({ userId: u.userId, username: u.username, players: rooms.get(roomId).users.get(u.userId).players })) });
    return;
  }
  room.currentTurnIndex=(room.currentTurnIndex+1)%room.turnOrder.length;
  advanceTurn(io, roomId);
}

module.exports = { registerSocketHandlers };
