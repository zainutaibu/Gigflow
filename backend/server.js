const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gigs');
const bidRoutes = require('./routes/bids');

const app = express();
const server = http.createServer(app);

// ✅ Allowed Origins (Multiple URLs)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://gigflow-1.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

// ✅ CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
};

// ✅ Socket.io setup with proper CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Trust proxy (Important for deployment)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Socket.io connection
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`👋 User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Make io and userSockets available to routes
app.set('io', io);
app.set('userSockets', userSockets);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'GigFlow API is running! 🚀',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bids', bidRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'GigFlow API is working!',
    timestamp: new Date().toISOString(),
    socket: 'Socket.io is ready',
    allowedOrigins: allowedOrigins
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connect to database then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Allowed Origins:`, allowedOrigins);
    console.log(`🔌 Socket.io ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});