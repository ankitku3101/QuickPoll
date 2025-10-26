import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import pollsRouter from './routes/polls';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use('/api/polls', pollsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-poll', (pollId: string) => {
    socket.join(`poll-${pollId}`);
    console.log(`Socket ${socket.id} joined poll ${pollId}`);
  });
  
  socket.on('leave-poll', (pollId: string) => {
    socket.leave(`poll-${pollId}`);
    console.log(`Socket ${socket.id} left poll ${pollId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { io };

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
