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
  RoomJoinedPayload,
} from '../types';

/**
 * useSocket — manages socket connection lifecycle, room state, cursors, presence toasts, and object events.
 */
export function useSocket() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>(() =>
    socketService.isConnected() ? 'connected' : 'connecting'
  );

  const [roomState, setRoomState] = useState<RoomState>({
    roomId: null,
    users: [],
    isConnected: socketService.isConnected(),
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

  useEffect(() => {
    const socket = socketService.connect();

    if (socket.connected) {
      setConnectionStatus('connected');
      setRoomState((prev) => ({ ...prev, isConnected: true, error: null }));
    }

    const handleConnect = () => {
      setConnectionStatus('connected');
      setRoomState((prev) => ({ ...prev, isConnected: true, error: null }));
    };

    const handleDisconnect = (reason: string) => {
      setConnectionStatus('disconnected');
      setRoomState((prev) => ({
        ...prev,
        isConnected: false,
        isJoined: false,
      }));
      setRemoteCursors(new Map());
      console.log('[Socket] Disconnected:', reason);
    };

    const handleConnectError = (err: Error) => {
      setConnectionStatus('error');
      setRoomState((prev) => ({
        ...prev,
        isConnected: false,
        error: `Cannot connect to server: ${err.message}`,
      }));
    };

    const handleRoomJoined = (data: RoomJoinedPayload) => {
      setRoomState((prev) => ({
        ...prev,
        roomId: data.roomId,
        users: data.users,
        isJoined: true,
        error: null,
        drawingHistory: data.drawingHistory,
      }));
    };

    const handleRoomError = (data: { message: string }) => {
      setRoomState((prev) => ({
        ...prev,
        error: data.message,
      }));
    };

    const handleUsersUpdated = (data: { users: UserInfo[]; count: number }) => {
      setRoomState((prev) => ({
        ...prev,
        users: data.users,
      }));
    };

    const handleUserJoinedToast = (data: { userId: string }) => {
      addToast(`${data.userId} joined the room`, 'info');
    };

    const handleUserLeftToast = (data: { userId: string }) => {
      addToast(`${data.userId} left the room`, 'warning');
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    const handleCursorUpdate = (cursor: CursorPosition) => {
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.set(cursor.userId, cursor);
        return next;
      });
    };

    const handleDrawEvent = (event: DrawEvent) => {
      onDrawEventRef.current?.(event);
    };

    const handleDrawClear = () => {
      onClearRef.current?.();
    };

    const handleDrawUndo = (data: { strokeId: string }) => {
      onUndoRef.current?.(data.strokeId);
    };

    const handleDrawRedo = (data: { strokeId: string }) => {
      onRedoRef.current?.(data.strokeId);
    };

    const handleObjectUpdate = (payload: ObjectUpdatePayload) => {
      onObjectUpdateRef.current?.(payload);
    };

    const handleObjectDelete = (payload: ObjectDeletePayload) => {
      onObjectDeleteRef.current?.(payload);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('room:joined', handleRoomJoined);
    socket.on('room:error', handleRoomError);
    socket.on('room:users_updated', handleUsersUpdated);
    socket.on('user:joined_toast', handleUserJoinedToast);
    socket.on('user:left_toast', handleUserLeftToast);
    socket.on('cursor:update', handleCursorUpdate);
    socket.on('draw:event', handleDrawEvent);
    socket.on('draw:clear', handleDrawClear);
    socket.on('draw:undo', handleDrawUndo);
    socket.on('draw:redo', handleDrawRedo);
    socket.on('object:update', handleObjectUpdate);
    socket.on('object:delete', handleObjectDelete);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:error', handleRoomError);
      socket.off('room:users_updated', handleUsersUpdated);
      socket.off('user:joined_toast', handleUserJoinedToast);
      socket.off('user:left_toast', handleUserLeftToast);
      socket.off('cursor:update', handleCursorUpdate);
      socket.off('draw:event', handleDrawEvent);
      socket.off('draw:clear', handleDrawClear);
      socket.off('draw:undo', handleDrawUndo);
      socket.off('draw:redo', handleDrawRedo);
      socket.off('object:update', handleObjectUpdate);
      socket.off('object:delete', handleObjectDelete);
    };
  }, [addToast]);

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
