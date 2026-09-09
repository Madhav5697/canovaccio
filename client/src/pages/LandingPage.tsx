import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomDialog } from '../components/RoomDialog';
import { useSocket } from '../hooks/useSocket';
import { generateUserId } from '../utils/helpers';

// ── Landing Page ──────────────────────────────────────────────────────────────

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<'create' | 'join' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Persist userId in sessionStorage so the same tab keeps its identity
  const getUserId = () => {
    let id = sessionStorage.getItem('drawsync_user_id');
    if (!id) {
      id = generateUserId();
      sessionStorage.setItem('drawsync_user_id', id);
    }
    return id;
  };

  const { connectionStatus, roomState, createRoom, joinRoom, clearError } = useSocket();

  const handleCreateRoom = async () => {
    setIsLoading(true);
    const userId = getUserId();
    const response = await createRoom(userId);
    setIsLoading(false);

    if (response.success && response.roomId) {
      navigate(`/room/${response.roomId}`, { state: { userId } });
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setIsLoading(true);
    const userId = getUserId();
    const response = await joinRoom(roomId, userId);
    setIsLoading(false);

    if (response.success && response.roomId) {
      navigate(`/room/${response.roomId}`, { state: { userId } });
    }
  };

  const handleCloseDialog = () => {
    setDialog(null);
    clearError();
  };

  const isOffline = connectionStatus === 'error' || connectionStatus === 'disconnected';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/30">
            DS
          </div>
          <span className="font-bold text-lg tracking-tight">DrawSync</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            connectionStatus === 'connected'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting…' :
             'Offline'}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Real-time collaborative drawing
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Draw Together,{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Anywhere
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Create a room, share the code, and sketch in real time with anyone on the planet.
            No sign-up required — just click and draw.
          </p>

          {/* Offline warning */}
          {isOffline && (
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              Server unreachable. Make sure the server is running.
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setDialog('create')}
              disabled={connectionStatus !== 'connected'}
              className="group relative flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Room
            </button>

            <button
              onClick={() => setDialog('join')}
              disabled={connectionStatus !== 'connected'}
              className="group flex items-center gap-3 px-8 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
              Join Room
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20 px-4">
          {[
            {
              icon: '⚡',
              title: 'Real-Time Sync',
              desc: 'Drawing events propagate to all room members in milliseconds via WebSockets.',
            },
            {
              icon: '🔒',
              title: 'Isolated Rooms',
              desc: 'Each room is completely separate. Your drawings stay private to your room.',
            },
            {
              icon: '🎨',
              title: 'Full Toolkit',
              desc: 'Pencil, eraser, shapes, color picker, brush sizes, undo/redo — everything you need.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="p-6 bg-gray-900/60 border border-gray-800/60 rounded-2xl text-left backdrop-blur-sm hover:border-gray-700 transition-colors"
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-white mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-gray-600 text-sm border-t border-gray-800/60">
        Built with React · TypeScript · Node.js · Socket.IO
      </footer>

      {/* Dialogs */}
      {dialog && (
        <RoomDialog
          mode={dialog}
          isLoading={isLoading}
          error={roomState.error}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
};
