import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from './types/index.js';
import { registerSocketHandlers } from './sockets/socketHandlers.js';
import { roomManager } from './rooms/roomManager.js';

const app = express();
const httpServer = createServer(app);

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// ── CORS ───────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: NODE_ENV === 'production' ? CLIENT_URL : ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: corsOptions.origin,
      methods: corsOptions.methods,
      credentials: corsOptions.credentials,
    },
    // Ping settings for connection health
    pingTimeout: 20000,
    pingInterval: 25000,
    // Max payload to prevent abuse
    maxHttpBufferSize: 1e5, // 100 KB
    transports: ['websocket', 'polling'],
  }
);

// ── REST ENDPOINTS ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: roomManager.getRoomCount(),
    timestamp: new Date().toISOString(),
    env: NODE_ENV,
  });
});

app.get('/api/room/:roomId/exists', (req, res) => {
  const { roomId } = req.params;
  // Validate format first
  if (!/^[A-Z0-9]{6}$/.test(roomId)) {
    res.status(400).json({ exists: false, error: 'Invalid room ID format' });
    return;
  }
  const exists = roomManager.roomExists(roomId);
  res.json({ exists });
});

// ── SOCKET HANDLERS ────────────────────────────────────────────────────────────
registerSocketHandlers(io);

// ── START ──────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Collaborative Canvas Server running!`);
  console.log(`   Environment : ${NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Client URL  : ${CLIENT_URL}`);
  console.log(`   Health      : http://localhost:${PORT}/health\n`);
});

// ── GRACEFUL SHUTDOWN ──────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down...');
  roomManager.destroy();
  httpServer.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});
