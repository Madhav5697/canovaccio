import React from 'react';
import { UserInfo } from '../types';

interface UserListProps {
  users: UserInfo[];
  currentUserId: string;
  isDark?: boolean;
}

export const UserList: React.FC<UserListProps> = ({ users, currentUserId, isDark = true }) => {
  return (
    <div className="flex items-center gap-2">
      {/* Online indicator + count */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
        isDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-gray-100 border-gray-200'
      }`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
          {users.length} {users.length === 1 ? 'user' : 'users'} online
        </span>
      </div>

      {/* User avatars */}
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className={`relative w-7 h-7 rounded-full border-2 ${isDark ? 'border-zinc-900' : 'border-white'} flex items-center justify-center text-xs font-bold text-white shadow-md transition-transform hover:scale-110 hover:z-10`}
            style={{ backgroundColor: user.color }}
            title={user.id === currentUserId ? `${user.id} (you)` : user.id}
          >
            {user.id.charAt(0).toUpperCase()}
            {user.id === currentUserId && (
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border ${isDark ? 'border-zinc-900' : 'border-white'}`} title="You" />
            )}
          </div>
        ))}
        {users.length > 5 && (
          <div className={`w-7 h-7 rounded-full border-2 ${isDark ? 'border-zinc-900 bg-zinc-800 text-zinc-300' : 'border-white bg-gray-200 text-gray-700'} flex items-center justify-center text-xs font-medium`}>
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};
