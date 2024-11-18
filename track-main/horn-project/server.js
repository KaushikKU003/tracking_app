const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'https://vehiceltracking.vercel.app/', // Allow frontend requests from localhost:3000
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Enable CORS
app.use(cors({
  origin: 'https://vehiceltracking.vercel.app/',
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.get('/', (req, res) => {
  res.send('Horn Notification Backend');
});

// Set up socket connection and handle 'horn' event
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for horn event and notify all other clients
  socket.on('horn', () => {
    socket.broadcast.emit('notifyHorn');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});