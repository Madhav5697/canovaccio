import { Room, User, DrawEvent, UserInfo, ObjectUpdatePayload } from '../types/index.js';

// Color palette for users
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#82E0AA', '#F8C471',
];

const MAX_HISTORY_SIZE = 500; // Maximum drawing events stored per room
const MAX_ROOM_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodically clean up old empty rooms
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldRooms();
    }, 60 * 60 * 1000); // Every hour
  }

  createRoom(): Room {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      users: new Map(),
      createdAt: Date.now(),
      drawingHistory: [],
    };
    this.rooms.set(roomId, room);
    console.log(`[Room] Created room: ${roomId}`);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  addUserToRoom(roomId: string, socketId: string, userId: string): User | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const color = this.assignColor(room);
    const user: User = {
      id: userId,
      socketId,
      color,
      roomId,
      joinedAt: Date.now(),
    };

    room.users.set(socketId, user);
    console.log(`[Room] User ${userId} joined room ${roomId}. Total users: ${room.users.size}`);
    return user;
  }

  removeUserFromRoom(socketId: string): { roomId: string; room: Room; userId?: string } | null {
    for (const [roomId, room] of this.rooms) {
      if (room.users.has(socketId)) {
        const user = room.users.get(socketId);
        const userId = user?.id;
        room.users.delete(socketId);
        console.log(`[Room] User ${userId} left room ${roomId}. Remaining: ${room.users.size}`);

        // Clean up empty rooms after a short delay
        if (room.users.size === 0) {
          setTimeout(() => {
            if (this.rooms.get(roomId)?.users.size === 0) {
              this.rooms.delete(roomId);
              console.log(`[Room] Deleted empty room: ${roomId}`);
            }
          }, 30000); // Keep empty room for 30 seconds in case of reconnect
        }

        return { roomId, room, userId };
      }
    }
    return null;
  }

  getUserBySocket(socketId: string): User | null {
    for (const room of this.rooms.values()) {
      const user = room.users.get(socketId);
      if (user) return user;
    }
    return null;
  }

  getRoomUsers(roomId: string): UserInfo[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.users.values()).map((u) => ({
      id: u.id,
      color: u.color,
    }));
  }

  addDrawEvent(roomId: string, event: DrawEvent): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Store completed strokes and objects to history
    if (event.type === 'draw_end' || event.type === 'clear') {
      room.drawingHistory.push(event);

      // Trim history if it gets too large
      if (room.drawingHistory.length > MAX_HISTORY_SIZE) {
        room.drawingHistory = room.drawingHistory.slice(-MAX_HISTORY_SIZE);
      }
    }
  }

  updateObject(roomId: string, payload: ObjectUpdatePayload): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const event = room.drawingHistory.find((e) => e.strokeId === payload.strokeId);
    if (event) {
      if (payload.transform) {
        event.transform = payload.transform;
      }
      if (payload.points) {
        event.points = payload.points;
      }
      if (payload.color) {
        event.color = payload.color;
      }
      if (payload.text !== undefined) {
        event.text = payload.text;
      }
    }
  }

  deleteObject(roomId: string, strokeId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.drawingHistory = room.drawingHistory.filter((e) => e.strokeId !== strokeId);
  }

  getDrawingHistory(roomId: string): DrawEvent[] {
    return this.rooms.get(roomId)?.drawingHistory ?? [];
  }

  clearRoomCanvas(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.drawingHistory = [];
    console.log(`[Room] Canvas cleared in room ${roomId} by user ${userId}`);
  }

  undoInRoom(roomId: string, strokeId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.drawingHistory = room.drawingHistory.filter((e) => e.strokeId !== strokeId);
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id: string;
    do {
      id = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (this.rooms.has(id));
    return id;
  }

  private assignColor(room: Room): string {
    const usedColors = new Set(Array.from(room.users.values()).map((u) => u.color));
    const available = USER_COLORS.filter((c) => !usedColors.has(c));
    return available.length > 0
      ? available[0]
      : USER_COLORS[room.users.size % USER_COLORS.length];
  }

  private cleanupOldRooms(): void {
    const now = Date.now();
    for (const [roomId, room] of this.rooms) {
      if (room.users.size === 0 && now - room.createdAt > MAX_ROOM_AGE_MS) {
        this.rooms.delete(roomId);
        console.log(`[Room] Cleaned up old room: ${roomId}`);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

export const roomManager = new RoomManager();
