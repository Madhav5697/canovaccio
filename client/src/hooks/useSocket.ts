import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import {
  RoomState,
  UserInfo,
  DrawEvent,
  CursorPosition,
  ObjectUpdatePayload,
  ObjectDeletePayload,
  ToastNotification,
} from '../types';

/**
 * useSocket — manages socket connection lifecycle, room state, cursors, presence toasts, and object events.
 */
export function useSocket() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [roomState, setRoomState] = useState<RoomState>({
    roomId: null,
    users: [],
    isConnected: false,
    isJoined: false,
    error: null,
    drawingHistory: [],
  });

  const [remoteCursors, setRemoteCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const onDrawEventRef = useRef<((event: DrawEvent) => void) | null>(null);
  const onClearRef = useRef<(() => void) | null>(null);
  const onUndoRef = useRef<((strokeId: string) => void) | null>(null);
  const onRedoRef = useRef<((strokeId: string) => void) | null>(null);
  const onObjectUpdateRef = useRef<((payload: ObjectUpdatePayload) => void) | null>(null);
  const onObjectDeleteRef = useRef<((payload: ObjectDeletePayload) => void) | null>(null);

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Connect to socket server
  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    const socket = socketService.connect();

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setRoomState((prev) => ({ ...prev, isConnected: true, error: null }));
    });

    socket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');
      setRoomState((prev) => ({
        ...prev,
        isConnected: false,
        isJoined: false,
      }));
      setRemoteCursors(new Map());
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      setConnectionStatus('error');
      setRoomState((prev) => ({
        ...prev,
        isConnected: false,
        error: `Cannot connect to server: ${err.message}`,
      }));
    });

    // Room events
    socket.on('room:joined', (data) => {
      setRoomState((prev) => ({
        ...prev,
        roomId: data.roomId,
        users: data.users,
        isJoined: true,
        error: null,
        drawingHistory: data.drawingHistory,
      }));
    });

    socket.on('room:error', (data) => {
      setRoomState((prev) => ({
        ...prev,
        error: data.message,
      }));
    });

    socket.on('room:users_updated', (data) => {
      setRoomState((prev) => ({
        ...prev,
        users: data.users as UserInfo[],
      }));
    });

    // Presence toast events
    socket.on('user:joined_toast', (data) => {
      addToast(`${data.userId} joined the room`, 'info');
    });

    socket.on('user:left_toast', (data) => {
      addToast(`${data.userId} left the room`, 'warning');
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    // Cursor position updates
    socket.on('cursor:update', (cursor) => {
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.set(cursor.userId, cursor);
        return next;
      });
    });

    // Drawing & object events
    socket.on('draw:event', (event) => {
      onDrawEventRef.current?.(event);
    });

    socket.on('draw:clear', () => {
      onClearRef.current?.();
    });

    socket.on('draw:undo', (data) => {
      onUndoRef.current?.(data.strokeId);
    });

    socket.on('draw:redo', (data) => {
      onRedoRef.current?.(data.strokeId);
    });

    socket.on('object:update', (payload) => {
      onObjectUpdateRef.current?.(payload);
    });

    socket.on('object:delete', (payload) => {
      onObjectDeleteRef.current?.(payload);
    });

    return socket;
  }, [addToast]);

  useEffect(() => {
    const socket = connect();
    return () => {
      socket.removeAllListeners();
      socketService.disconnect();
    };
  }, [connect]);

  const createRoom = useCallback(async (userId: string) => {
    try {
      const response = await socketService.createRoom(userId);
      if (!response.success) {
        setRoomState((prev) => ({ ...prev, error: response.error ?? 'Failed to create room' }));
      }
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      setRoomState((prev) => ({ ...prev, error: msg }));
      return { success: false, error: msg };
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, userId: string) => {
    try {
      const response = await socketService.joinRoom(roomId, userId);
      if (!response.success) {
        setRoomState((prev) => ({ ...prev, error: response.error ?? 'Failed to join room' }));
      }
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to join room';
      setRoomState((prev) => ({ ...prev, error: msg }));
      return { success: false, error: msg };
    }
  }, []);

  const leaveRoom = useCallback(() => {
    socketService.leaveRoom();
    setRoomState({
      roomId: null,
      users: [],
      isConnected: socketService.isConnected(),
      isJoined: false,
      error: null,
      drawingHistory: [],
    });
    setRemoteCursors(new Map());
  }, []);

  const clearError = useCallback(() => {
    setRoomState((prev) => ({ ...prev, error: null }));
  }, []);

  // Register canvas callbacks
  const setDrawEventHandler = useCallback((handler: (event: DrawEvent) => void) => {
    onDrawEventRef.current = handler;
  }, []);

  const setClearHandler = useCallback((handler: () => void) => {
    onClearRef.current = handler;
  }, []);

  const setUndoHandler = useCallback((handler: (strokeId: string) => void) => {
    onUndoRef.current = handler;
  }, []);

  const setRedoHandler = useCallback((handler: (strokeId: string) => void) => {
    onRedoRef.current = handler;
  }, []);

  const setObjectUpdateHandler = useCallback((handler: (payload: ObjectUpdatePayload) => void) => {
    onObjectUpdateRef.current = handler;
  }, []);

  const setObjectDeleteHandler = useCallback((handler: (payload: ObjectDeletePayload) => void) => {
    onObjectDeleteRef.current = handler;
  }, []);

  return {
    connectionStatus,
    roomState,
    remoteCursors,
    toasts,
    createRoom,
    joinRoom,
    leaveRoom,
    clearError,
    setDrawEventHandler,
    setClearHandler,
    setUndoHandler,
    setRedoHandler,
    setObjectUpdateHandler,
    setObjectDeleteHandler,
  };
}
