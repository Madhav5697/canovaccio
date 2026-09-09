import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  DrawEvent,
  CreateRoomPayload,
  CreateRoomResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  UndoRedoPayload,
  CursorPayload,
  ObjectUpdatePayload,
  ObjectDeletePayload,
} from '../types/index.js';
import { roomManager } from '../rooms/roomManager.js';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Validation helpers
function isValidRoomId(roomId: unknown): roomId is string {
  return typeof roomId === 'string' && /^[A-Z0-9]{6}$/.test(roomId);
}

function isValidUserId(userId: unknown): userId is string {
  return typeof userId === 'string' && userId.length >= 1 && userId.length <= 36;
}

function isValidDrawEvent(event: unknown): event is DrawEvent {
  if (!event || typeof event !== 'object') return false;
  const e = event as Partial<DrawEvent>;

  const validTypes = ['draw_start', 'draw_move', 'draw_end', 'clear', 'undo', 'redo'];
  const validTools = [
    'pencil',
    'brush',
    'eraser',
    'line',
    'rectangle',
    'circle',
    'triangle',
    'arrow',
    'fill',
    'text',
    'sticky',
    'image',
    'select',
    'pan',
  ];

  if (!validTypes.includes(e.type ?? '')) return false;
  if (!validTools.includes(e.tool ?? '')) return false;
  if (typeof e.color !== 'string') return false;
  if (typeof e.brushSize !== 'number' || e.brushSize < 1 || e.brushSize > 200) return false;
  if (!Array.isArray(e.points)) return false;
  if (typeof e.userId !== 'string') return false;
  if (typeof e.strokeId !== 'string') return false;

  return true;
}

export function registerSocketHandlers(io: AppServer): void {
  io.on('connection', (socket: AppSocket) => {
    const clientIp = socket.handshake.address;
    console.log(`[Socket] Client connected: ${socket.id} from ${clientIp}`);

    // ── CREATE ROOM ────────────────────────────────────────────────────────────
    socket.on('room:create', (payload: CreateRoomPayload, callback) => {
      try {
        if (!isValidUserId(payload?.userId)) {
          const response: CreateRoomResponse = { success: false, error: 'Invalid user ID' };
          callback(response);
          return;
        }

        const room = roomManager.createRoom();
        const user = roomManager.addUserToRoom(room.id, socket.id, payload.userId);

        if (!user) {
          callback({ success: false, error: 'Failed to create room' });
          return;
        }

        socket.data.userId = payload.userId;
        socket.data.roomId = room.id;
        socket.data.color = user.color;

        socket.join(room.id);

        // Notify the creator
        socket.emit('room:joined', {
          roomId: room.id,
          users: roomManager.getRoomUsers(room.id),
          drawingHistory: [],
        });

        // Update user list
        io.to(room.id).emit('room:users_updated', {
          users: roomManager.getRoomUsers(room.id),
          count: roomManager.getRoomUsers(room.id).length,
        });

        console.log(`[Socket] Room created: ${room.id} by ${payload.userId}`);
        callback({ success: true, roomId: room.id });
      } catch (err) {
        console.error('[Socket] room:create error', err);
        callback({ success: false, error: 'Server error' });
      }
    });

    // ── JOIN ROOM ──────────────────────────────────────────────────────────────
    socket.on('room:join', (payload: JoinRoomPayload, callback) => {
      try {
        const { roomId, userId } = payload ?? {};

        if (!isValidRoomId(roomId)) {
          const response: JoinRoomResponse = { success: false, error: 'Invalid room ID format' };
          callback(response);
          return;
        }

        if (!isValidUserId(userId)) {
          callback({ success: false, error: 'Invalid user ID' });
          return;
        }

        if (!roomManager.roomExists(roomId)) {
          callback({ success: false, error: 'Room not found. Check the room ID and try again.' });
          return;
        }

        const user = roomManager.addUserToRoom(roomId, socket.id, userId);
        if (!user) {
          callback({ success: false, error: 'Failed to join room' });
          return;
        }

        socket.data.userId = userId;
        socket.data.roomId = roomId;
        socket.data.color = user.color;

        socket.join(roomId);

        const history = roomManager.getDrawingHistory(roomId);

        // Send current state to the joining user
        socket.emit('room:joined', {
          roomId,
          users: roomManager.getRoomUsers(roomId),
          drawingHistory: history,
        });

        // Notify all room members of updated user list
        io.to(roomId).emit('room:users_updated', {
          users: roomManager.getRoomUsers(roomId),
          count: roomManager.getRoomUsers(roomId).length,
        });

        // Broadcast toast notification to others in the room
        socket.to(roomId).emit('user:joined_toast', { userId });

        console.log(`[Socket] User ${userId} joined room ${roomId}`);
        callback({ success: true, roomId });
      } catch (err) {
        console.error('[Socket] room:join error', err);
        callback({ success: false, error: 'Server error' });
      }
    });

    // ── LEAVE ROOM ─────────────────────────────────────────────────────────────
    socket.on('room:leave', () => {
      handleDisconnect(socket, io);
    });

    // ── DRAW EVENT ─────────────────────────────────────────────────────────────
    socket.on('draw:event', (event: DrawEvent) => {
      try {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        if (!isValidDrawEvent(event)) {
          console.warn(`[Socket] Invalid draw event from ${socket.id}`);
          return;
        }

        const authorizedEvent: DrawEvent = {
          ...event,
          userId: socket.data.userId ?? event.userId,
          timestamp: Date.now(),
        };

        // Store completed strokes to room history
        roomManager.addDrawEvent(roomId, authorizedEvent);

        // Broadcast to everyone else in the room
        socket.to(roomId).emit('draw:event', authorizedEvent);
      } catch (err) {
        console.error('[Socket] draw:event error', err);
      }
    });

    // ── CURSOR MOVE ─────────────────────────────────────────────────────────────
    socket.on('cursor:move', (data: CursorPayload) => {
      try {
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;
        const color = socket.data.color;
        if (!roomId || !userId) return;

        socket.to(roomId).emit('cursor:update', {
          userId,
          color: color ?? data.color,
          x: data.x,
          y: data.y,
        });
      } catch (err) {
        console.error('[Socket] cursor:move error', err);
      }
    });

    // ── OBJECT UPDATE (MOVE/RESIZE) ─────────────────────────────────────────────
    socket.on('object:update', (data: ObjectUpdatePayload) => {
      try {
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;
        if (!roomId || !userId) return;

        roomManager.updateObject(roomId, data);
        socket.to(roomId).emit('object:update', {
          ...data,
          userId,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[Socket] object:update error', err);
      }
    });

    // ── OBJECT DELETE ───────────────────────────────────────────────────────────
    socket.on('object:delete', (data: ObjectDeletePayload) => {
      try {
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;
        if (!roomId || !userId) return;

        roomManager.deleteObject(roomId, data.strokeId);
        io.to(roomId).emit('object:delete', {
          ...data,
          userId,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[Socket] object:delete error', err);
      }
    });

    // ── CLEAR CANVAS ───────────────────────────────────────────────────────────
    socket.on('draw:clear', () => {
      try {
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;
        if (!roomId || !userId) return;

        roomManager.clearRoomCanvas(roomId, userId);

        io.to(roomId).emit('draw:clear', {
          userId,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[Socket] draw:clear error', err);
      }
    });

    // ── UNDO ───────────────────────────────────────────────────────────────────
    socket.on('draw:undo', (data: UndoRedoPayload) => {
      try {
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;
        if (!roomId || !userId) return;
        if (typeof data?.strokeId !== 'string') return;

        roomManager.undoInRoom(roomId, data.strokeId);
        io.to(roomId).emit('draw:undo', {
          userId,
          strokeId: data.strokeId,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[Socket] draw:undo error', err);
      }
    });

    // ── REDO ───────────────────────────────────────────────────────────────────
    socket.on('draw:redo', (data: UndoRedoPayload) => {
      try {
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;
        if (!roomId || !userId) return;
        if (typeof data?.strokeId !== 'string') return;

        io.to(roomId).emit('draw:redo', {
          userId,
          strokeId: data.strokeId,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[Socket] draw:redo error', err);
      }
    });

    // ── DISCONNECT ─────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} - Reason: ${reason}`);
      handleDisconnect(socket, io);
    });
  });
}

function handleDisconnect(socket: AppSocket, io: AppServer): void {
  const result = roomManager.removeUserFromRoom(socket.id);
  if (result) {
    const { roomId, room, userId } = result;
    socket.leave(roomId);

    // Notify remaining users
    io.to(roomId).emit('room:users_updated', {
      users: Array.from(room.users.values()).map((u) => ({ id: u.id, color: u.color })),
      count: room.users.size,
    });

    if (userId) {
      io.to(roomId).emit('user:left_toast', { userId });
    }

    console.log(`[Socket] Updated room ${roomId} after disconnect. Users: ${room.users.size}`);
  }
}
