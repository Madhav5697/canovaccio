import React, { useState } from 'react';
import { isValidRoomId } from '../utils/helpers';

// ── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ── Props ────────────────────────────────────────────────────────────────────

interface RoomDialogProps {
  mode: 'create' | 'join';
  isLoading: boolean;
  error: string | null;
  isDark?: boolean;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onClose: () => void;
}

export const RoomDialog: React.FC<RoomDialogProps> = ({
  mode,
  isLoading,
  error,
  isDark: isDarkProp,
  onCreateRoom,
  onJoinRoom,
  onClose,
}) => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [inputError, setInputError] = useState('');

  // Fallback to localStorage if isDark is not passed directly
  const isDark = isDarkProp ?? (typeof window !== 'undefined' && localStorage.getItem('drawsync_theme') === 'dark');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = roomIdInput.trim().toUpperCase();

    if (!id) {
      setInputError('Please enter a room ID');
      return;
    }
    if (!isValidRoomId(id)) {
      setInputError('Room ID must be 6 characters (letters and numbers only)');
      return;
    }
    setInputError('');
    onJoinRoom(id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomIdInput(val);
    if (inputError) setInputError('');
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-sm rounded-2xl border shadow-2xl animate-slide-up transition-colors duration-300 overflow-hidden ${
        isDark
          ? 'bg-[#121215] border-zinc-800 text-white shadow-black/80'
          : 'bg-white border-gray-100 text-gray-900 shadow-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b transition-colors ${
          isDark ? 'border-zinc-800/80' : 'border-gray-100'
        }`}>
          <h2 className="font-playfair italic font-bold text-lg tracking-tight">
            {mode === 'create' ? 'Create a Room' : 'Join a Room'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'create' ? (
            <div className="space-y-5">
              <p className={`text-sm leading-relaxed font-medium ${
                isDark ? 'text-zinc-300' : 'text-gray-800'
              }`}>
                A unique room ID will be generated for you. Share it with anyone to draw together in real time.
              </p>
              <button
                onClick={onCreateRoom}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isLoading ? <SpinnerIcon /> : <PlusIcon />}
                {isLoading ? 'Creating room…' : 'Create Room'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-5">
              <p className={`text-sm leading-relaxed font-medium ${
                isDark ? 'text-zinc-300' : 'text-gray-800'
              }`}>
                Enter the 6-character room ID shared by your teammate.
              </p>
              <div>
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={handleInputChange}
                  placeholder="AB12CD"
                  maxLength={6}
                  autoFocus
                  className={`w-full px-4 py-3 border rounded-xl text-center text-xl font-mono tracking-[0.25em] placeholder:text-sm placeholder:tracking-normal focus:outline-none transition-all ${
                    inputError
                      ? 'border-red-500 ring-1 ring-red-500'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-600'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-900'
                  }`}
                  aria-label="Room ID"
                  aria-invalid={!!inputError}
                  aria-describedby={inputError ? 'room-id-error' : undefined}
                />
                {inputError && (
                  <p id="room-id-error" className="mt-2 text-xs text-red-400 flex items-center justify-center gap-1">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {inputError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || roomIdInput.length !== 6}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-white text-zinc-900 hover:bg-zinc-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isLoading ? <SpinnerIcon /> : <ArrowRightIcon />}
                {isLoading ? 'Joining room…' : 'Join Room'}
              </button>
            </form>
          )}

          {/* Server error */}
          {error && (
            <div className={`mt-4 p-3 border rounded-xl text-xs flex items-start gap-2 ${
              isDark ? 'bg-red-950/40 border-red-900/50 text-red-400' : 'bg-red-50 border-red-100 text-red-500'
            }`}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
