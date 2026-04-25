const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join specific match room for live updates
  socket.on('join-match', (matchId) => {
    socket.join(`match:${matchId}`);
    console.log(`Socket ${socket.id} joined match ${matchId}`);
  });

  socket.on('leave-match', (matchId) => {
    socket.leave(`match:${matchId}`);
    console.log(`Socket ${socket.id} left match ${matchId}`);
  });

  // Handle score updates from admin dashboard
  socket.on('update-score', (data) => {
    const { matchId, setNumber, gameNumber, team1Points, team2Points } = data;
    
    // Broadcast to all clients watching this match
    io.to(`match:${matchId}`).emit('score-updated', {
      matchId,
      setNumber,
      gameNumber,
      team1Points,
      team2Points,
    });
    
    console.log(`Score updated for match ${matchId}: Set ${setNumber}, Game ${gameNumber}`);
  });

  // Handle match started
  socket.on('match-started', (data) => {
    const { matchId } = data;
    
    io.to(`match:${matchId}`).emit('match-started', data);
    console.log(`Match ${matchId} started`);
  });

  // Handle match completed
  socket.on('match-completed', (data) => {
    const { matchId } = data;
    
    io.to(`match:${matchId}`).emit('match-completed', data);
    io.emit('standings-updated', { timestamp: new Date() });
    
    console.log(`Match ${matchId} completed`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.SOCKET_PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
