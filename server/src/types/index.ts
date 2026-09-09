// Shared TypeScript types for the server

export interface User {
  id: string;
  socketId: string;
  color: string;
  roomId: string;
  joinedAt: number;
}

export interface Room {
  id: string;
  users: Map<string, User>;
  createdAt: number;
  drawingHistory: DrawEvent[];
}

// Drawing event types
export type DrawTool =
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'arrow'
  | 'fill'
  | 'text'
  | 'image'
  | 'select'
  | 'pan';

export interface Point {
  x: number;
  y: number;
}

export interface DrawEvent {
  type: 'draw_start' | 'draw_move' | 'draw_end' | 'clear' | 'undo' | 'redo';
  tool: DrawTool;
  color: string;
  brushSize: number;
  points: Point[];
  userId: string;
  timestamp: number;
  strokeId: string;
  // Extended properties for text, shapes, sticky notes, fill, and images
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  width?: number;
  height?: number;
  imageUrl?: string;
  fillColor?: string;
  noteColor?: string;
  isDeleted?: boolean;
  transform?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
}

export interface CursorPayload {
  userId: string;
  color: string;
  x: number;
  y: number;
}

export interface ObjectUpdatePayload {
  userId: string;
  strokeId: string;
  points?: Point[];
  transform?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  color?: string;
  text?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  timestamp: number;
}

export interface ObjectDeletePayload {
  userId: string;
  strokeId: string;
  timestamp: number;
}

// Socket event payloads (server-to-client)
export interface ServerToClientEvents {
  'room:joined': (data: RoomJoinedPayload) => void;
  'room:error': (data: RoomErrorPayload) => void;
  'room:users_updated': (data: UsersUpdatedPayload) => void;
  'room:history': (data: HistoryPayload) => void;
  'user:joined_toast': (data: { userId: string }) => void;
  'user:left_toast': (data: { userId: string }) => void;
  'draw:event': (data: DrawEvent) => void;
  'draw:clear': (data: ClearPayload) => void;
  'draw:undo': (data: UndoPayload) => void;
  'draw:redo': (data: RedoPayload) => void;
  'cursor:update': (data: CursorPayload) => void;
  'object:update': (data: ObjectUpdatePayload) => void;
  'object:delete': (data: ObjectDeletePayload) => void;
}

// Socket event payloads (client-to-server)
export interface ClientToServerEvents {
  'room:create': (data: CreateRoomPayload, callback: (response: CreateRoomResponse) => void) => void;
  'room:join': (data: JoinRoomPayload, callback: (response: JoinRoomResponse) => void) => void;
  'room:leave': () => void;
  'draw:event': (data: DrawEvent) => void;
  'draw:clear': () => void;
  'draw:undo': (data: UndoRedoPayload) => void;
  'draw:redo': (data: UndoRedoPayload) => void;
  'cursor:move': (data: CursorPayload) => void;
  'object:update': (data: ObjectUpdatePayload) => void;
  'object:delete': (data: ObjectDeletePayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  roomId: string;
  color: string;
}

// Payload types
export interface CreateRoomPayload {
  userId: string;
}

export interface CreateRoomResponse {
  success: boolean;
  roomId?: string;
  error?: string;
}

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId?: string;
  error?: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  users: UserInfo[];
  drawingHistory: DrawEvent[];
}

export interface RoomErrorPayload {
  message: string;
}

export interface UsersUpdatedPayload {
  users: UserInfo[];
  count: number;
}

export interface HistoryPayload {
  drawingHistory: DrawEvent[];
}

export interface ClearPayload {
  userId: string;
  timestamp: number;
}

export interface UndoPayload {
  userId: string;
  strokeId: string;
  timestamp: number;
}

export interface RedoPayload {
  userId: string;
  strokeId: string;
  timestamp: number;
}

export interface UndoRedoPayload {
  strokeId: string;
}

export interface UserInfo {
  id: string;
  color: string;
}
