import { io, Socket } from 'socket.io-client';
import {
  DrawEvent,
  RoomJoinedPayload,
  UsersUpdatedPayload,
  ClearPayload,
  UndoPayload,
  RedoPayload,
  CreateRoomResponse,
  JoinRoomResponse,
  CursorPosition,
  ObjectUpdatePayload,
  ObjectDeletePayload,
} from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

// Socket.IO event type definitions
interface ServerToClientEvents {
  'room:joined': (data: RoomJoinedPayload) => void;
  'room:error': (data: { message: string }) => void;
  'room:users_updated': (data: UsersUpdatedPayload) => void;
  'user:joined_toast': (data: { userId: string }) => void;
  'user:left_toast': (data: { userId: string }) => void;
  'draw:event': (data: DrawEvent) => void;
  'draw:clear': (data: ClearPayload) => void;
  'draw:undo': (data: UndoPayload) => void;
  'draw:redo': (data: RedoPayload) => void;
  'cursor:update': (data: CursorPosition) => void;
  'object:update': (data: ObjectUpdatePayload) => void;
  'object:delete': (data: ObjectDeletePayload) => void;
}

interface ClientToServerEvents {
  'room:create': (data: { userId: string }, callback: (res: CreateRoomResponse) => void) => void;
  'room:join': (data: { roomId: string; userId: string }, callback: (res: JoinRoomResponse) => void) => void;
  'room:leave': () => void;
  'draw:event': (data: DrawEvent) => void;
  'draw:clear': () => void;
  'draw:undo': (data: { strokeId: string }) => void;
  'draw:redo': (data: { strokeId: string }) => void;
  'cursor:move': (data: CursorPosition) => void;
  'object:update': (data: ObjectUpdatePayload) => void;
  'object:delete': (data: ObjectDeletePayload) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Room actions ─────────────────────────────────────────────────────────────

  createRoom(userId: string): Promise<CreateRoomResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }
      this.socket.emit('room:create', { userId }, (res) => {
        resolve(res);
      });
    });
  }

  joinRoom(roomId: string, userId: string): Promise<JoinRoomResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }
      this.socket.emit('room:join', { roomId, userId }, (res) => {
        resolve(res);
      });
    });
  }

  leaveRoom(): void {
    this.socket?.emit('room:leave');
  }

  // ── Drawing & Object actions ───────────────────────────────────────────────

  sendDrawEvent(event: DrawEvent): void {
    this.socket?.emit('draw:event', event);
  }

  sendCursorMove(cursor: CursorPosition): void {
    this.socket?.emit('cursor:move', cursor);
  }

  sendObjectUpdate(payload: ObjectUpdatePayload): void {
    this.socket?.emit('object:update', payload);
  }

  sendObjectDelete(payload: ObjectDeletePayload): void {
    this.socket?.emit('object:delete', payload);
  }

  sendClear(): void {
    this.socket?.emit('draw:clear');
  }

  sendUndo(strokeId: string): void {
    this.socket?.emit('draw:undo', { strokeId });
  }

  sendRedo(strokeId: string): void {
    this.socket?.emit('draw:redo', { strokeId });
  }

  // ── Event listeners ──────────────────────────────────────────────────────────

  on<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.on(event as any, listener as any);
  }

  off<K extends keyof ServerToClientEvents>(
    event: K,
    listener?: ServerToClientEvents[K]
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.off(event as any, listener as any);
  }
}

// Export a singleton
export const socketService = new SocketService();
