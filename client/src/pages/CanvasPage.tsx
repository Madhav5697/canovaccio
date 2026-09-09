import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { UserList } from '../components/UserList';
import { ExportModal } from '../components/ExportModal';
import { HelpPanel } from '../components/HelpPanel';
import { ToastContainer } from '../components/ToastContainer';
import { useSocket } from '../hooks/useSocket';
import { DrawTool } from '../types';
import { copyToClipboard, isValidRoomId, generateUserId } from '../utils/helpers';

export const CanvasPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get or generate userId
  const [userId] = useState<string>(() => {
    const fromState = (location.state as { userId?: string })?.userId;
    if (fromState) return fromState;
    let id = sessionStorage.getItem('drawsync_user_id');
    if (!id) {
      id = generateUserId();
      sessionStorage.setItem('drawsync_user_id', id);
    }
    return id;
  });

  // Tool settings state
  const [tool, setTool] = useState<DrawTool>('pencil');
  const [color, setColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState(4);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [stickyColor, setStickyColor] = useState('#FEF08A');

  // Modal states
  const [showExport, setShowExport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Canvas element reference for exporting
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    connectionStatus,
    roomState,
    remoteCursors,
    toasts,
    joinRoom,
    leaveRoom,
    clearError,
    setDrawEventHandler,
    setClearHandler,
    setUndoHandler,
    setRedoHandler,
    setObjectUpdateHandler,
    setObjectDeleteHandler,
  } = useSocket();

  // Auto-join room on mount
  useEffect(() => {
    if (!roomId || !isValidRoomId(roomId)) {
      navigate('/', { replace: true });
      return;
    }

    if (connectionStatus === 'connected' && !roomState.isJoined) {
      joinRoom(roomId.toUpperCase(), userId);
    }
  }, [connectionStatus, roomState.isJoined, roomId, userId, joinRoom, navigate]);

  // Handle room errors
  useEffect(() => {
    if (roomState.error && roomState.error.includes('not found')) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [roomState.error, navigate]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    navigate('/', { replace: true });
  }, [leaveRoom, navigate]);

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const handleCopyRoomId = async () => {
    if (!roomId) return;
    const success = await copyToClipboard(roomId.toUpperCase());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentUser = roomState.users.find((u) => u.id === userId);
  const userColor = currentUser?.color ?? '#3B82F6';

  // Connecting state
  if (connectionStatus === 'connecting' || connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Connecting to server…</p>
      </div>
    );
  }

  // Connection error
  if (connectionStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-white p-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold">Cannot connect to server</h2>
        <p className="text-gray-400 text-center max-w-md">
          The server appears to be offline. Please make sure the server is running and try again.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Room not found
  if (roomState.error && roomState.error.includes('not found')) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-white p-4">
        <div className="text-5xl">🚫</div>
        <h2 className="text-2xl font-bold">Room Not Found</h2>
        <p className="text-gray-400 text-center max-w-md">{roomState.error}</p>
        <p className="text-gray-500 text-sm">Redirecting to home…</p>
      </div>
    );
  }

  // Joining room...
  if (!roomState.isJoined) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Joining room {roomId}…</p>
        {roomState.error && (
          <p className="text-red-400 text-sm">{roomState.error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900/90 border-b border-gray-800 backdrop-blur-sm flex-shrink-0">
        {/* Left: Logo + Room ID */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            aria-label="Leave room and go back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden sm:inline text-sm font-medium">Leave</span>
          </button>

          <div className="h-5 w-px bg-gray-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider hidden sm:inline">Room</span>
            <code className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-lg text-blue-400 font-mono text-sm font-bold tracking-widest">
              {roomId?.toUpperCase()}
            </code>
            <button
              onClick={handleCopyRoomId}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
              aria-label="Copy room ID"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy ID
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Users + Actions */}
        <div className="flex items-center gap-3">
          {roomState.error && !roomState.error.includes('not found') && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {roomState.error}
              <button onClick={clearError} className="ml-1 hover:text-red-300">✕</button>
            </div>
          )}

          <UserList users={roomState.users} currentUserId={userId} />

          {/* Export button */}
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/25"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>

          {/* Help button */}
          <button
            onClick={() => setShowHelp(true)}
            className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors font-bold text-xs border border-gray-700"
            title="Help & Shortcuts (?)"
          >
            ?
          </button>

          {/* Reconnect indicator */}
          {connectionStatus !== 'connected' && (
            <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              Reconnecting…
            </div>
          )}
        </div>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 p-3 overflow-hidden">
        <DrawingCanvas
          roomId={roomState.roomId ?? ''}
          userId={userId}
          userColor={userColor}
          users={roomState.users}
          tool={tool}
          color={color}
          brushSize={brushSize}
          fontSize={fontSize}
          fontFamily={fontFamily}
          isBold={isBold}
          isItalic={isItalic}
          stickyColor={stickyColor}
          drawingHistory={roomState.drawingHistory}
          remoteCursors={remoteCursors}
          onToolChange={setTool}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onFontSizeChange={setFontSize}
          onFontFamilyChange={setFontFamily}
          onBoldToggle={() => setIsBold((b) => !b)}
          onItalicToggle={() => setIsItalic((i) => !i)}
          onStickyColorChange={setStickyColor}
          onExport={() => setShowExport(true)}
          onHelp={() => setShowHelp(true)}
          onRemoteDrawEvent={setDrawEventHandler}
          onRemoteObjectUpdate={setObjectUpdateHandler}
          onRemoteObjectDelete={setObjectDeleteHandler}
          onRemoteClear={setClearHandler}
          onRemoteUndo={setUndoHandler}
          onRemoteRedo={setRedoHandler}
          onCanvasReady={(c) => { canvasRef.current = c; }}
        />
      </main>

      {/* Modals & Toasts */}
      {showExport && (
        <ExportModal
          canvasRef={canvasRef}
          onClose={() => setShowExport(false)}
        />
      )}

      {showHelp && (
        <HelpPanel onClose={() => setShowHelp(false)} />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
};
