const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
      console.log('User joined room:', roomId);
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { players: [], moves: {} });
      }
      const room = rooms.get(roomId);
      room.players.push(socket.id);
      
      if (room.players.length === 2) {
        console.log('Game ready in room:', roomId);
        io.to(roomId).emit('gameReady');
      }
    });

    socket.on('makeMove', ({ roomId, choice }) => {
      console.log('Move made in room:', roomId, 'by:', socket.id);
      const room = rooms.get(roomId);
      if (room) {
        room.moves[socket.id] = choice;
        if (Object.keys(room.moves).length === 2) {
          io.to(roomId).emit('gameResult', room.moves);
          room.moves = {};
        }
      }
    });

    socket.on('resetGame', (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.moves = {};
        io.to(roomId).emit('gameReset');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      rooms.forEach((room, roomId) => {
        room.players = room.players.filter(id => id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        }
      });
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
