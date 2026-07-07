import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler } from './middleware/validateMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.use(cookieParser());

const httpServer = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  message: { message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const io = new Server(httpServer, { cors: corsOptions });

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'Welcome to Annaseva API' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/annaseva';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });