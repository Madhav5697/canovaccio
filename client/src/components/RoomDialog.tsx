import React, { useState } from 'react';
import { isValidRoomId } from '../utils/helpers';

// ── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ── Props ────────────────────────────────────────────────────────────────────

interface RoomDialogProps {
  mode: 'create' | 'join';
  isLoading: boolean;
  error: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onClose: () => void;
}

export const RoomDialog: React.FC<RoomDialogProps> = ({
  mode,
  isLoading,
  error,
  onCreateRoom,
  onJoinRoom,
  onClose,
}) => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [inputError, setInputError] = useState('');

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/60">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'create' ? '🎨 Create a Room' : '🚀 Join a Room'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-800"
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'create' ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm leading-relaxed">
                A unique room ID will be generated for you. Share it with anyone to draw together in real time.
              </p>
              <button
                onClick={onCreateRoom}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                {isLoading ? <SpinnerIcon /> : <PlusIcon />}
                {isLoading ? 'Creating room…' : 'Create Room'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <p className="text-gray-400 text-sm leading-relaxed">
                Enter the 6-character room ID shared by someone else.
              </p>
              <div>
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={handleInputChange}
                  placeholder="E.g. AB12CD"
                  maxLength={6}
                  autoFocus
                  className={`w-full px-4 py-3 bg-gray-800 border ${
                    inputError ? 'border-red-500' : 'border-gray-700'
                  } rounded-xl text-white text-center text-2xl font-mono tracking-[0.3em] placeholder:text-gray-600 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  aria-label="Room ID"
                  aria-invalid={!!inputError}
                  aria-describedby={inputError ? 'room-id-error' : undefined}
                />
                {inputError && (
                  <p id="room-id-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
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
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
              >
                {isLoading ? <SpinnerIcon /> : <ArrowRightIcon />}
                {isLoading ? 'Joining room…' : 'Join Room'}
              </button>
            </form>
          )}

          {/* Server error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
