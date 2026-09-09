// Shared TypeScript types for the client

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
  | 'sticky'
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
  // Extended properties
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

export interface UserInfo {
  id: string;
  color: string;
}

export interface CursorPosition {
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

export interface RoomState {
  roomId: string | null;
  users: UserInfo[];
  isConnected: boolean;
  isJoined: boolean;
  error: string | null;
  drawingHistory: DrawEvent[];
}

export interface DrawingState {
  tool: DrawTool;
  color: string;
  brushSize: number;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  stickyColor: string;
}

export type CanvasAction =
  | { type: 'DRAW'; event: DrawEvent }
  | { type: 'CLEAR' }
  | { type: 'UNDO'; strokeId: string }
  | { type: 'REDO'; strokeId: string };

export interface Stroke {
  id: string;
  events: DrawEvent[];
  userId: string;
}

// Socket payloads
export interface RoomJoinedPayload {
  roomId: string;
  users: UserInfo[];
  drawingHistory: DrawEvent[];
}

export interface UsersUpdatedPayload {
  users: UserInfo[];
  count: number;
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

export interface CreateRoomResponse {
  success: boolean;
  roomId?: string;
  error?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId?: string;
  error?: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}
