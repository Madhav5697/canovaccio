import React from 'react';
import { CursorPosition, UserInfo } from '../types';

interface LiveCursorsProps {
  cursors: Map<string, CursorPosition>;
  users: UserInfo[];
  currentUserId: string;
  zoom: number;
  pan: { x: number; y: number };
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({
  cursors,
  users,
  currentUserId,
  zoom,
  pan,
}) => {
  const cursorList = Array.from(cursors.values()).filter(
    (cursor) => cursor.userId !== currentUserId
  );

  if (cursorList.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {cursorList.map((cursor) => {
        // Map canvas coordinates to screen coordinates
        const screenX = cursor.x * zoom + pan.x;
        const screenY = cursor.y * zoom + pan.y;

        const userObj = users.find((u) => u.id === cursor.userId);
        const color = userObj?.color ?? cursor.color ?? '#3B82F6';

        return (
          <div
            key={cursor.userId}
            className="absolute top-0 left-0 transition-transform duration-75 ease-out flex items-center gap-1.5"
            style={{
              transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
            }}
          >
            {/* SVG Mouse Cursor Pointer */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={color}
              stroke="white"
              strokeWidth="1.5"
              className="drop-shadow-md"
            >
              <path d="M5.5 3.5L19 12L12 14L9 21L5.5 3.5Z" />
            </svg>

            {/* Name Tag */}
            <div
              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white shadow-lg whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {cursor.userId}
            </div>
          </div>
        );
      })}
    </div>
  );
};
