import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { User, Crown, Volume2, VolumeX } from 'lucide-react';

export function UserSidebar({ 
  users, 
  currentUsername, 
  isModerator, 
  onMuteUser, 
  onUnmuteUser, 
  onClose, 
  isMobile 
}) {
  const sortedUsers = [...users].sort((a, b) => {
    // Sort by moderator status first
    if (a.isModerator && !b.isModerator) return -1;
    if (!a.isModerator && b.isModerator) return 1;
    // Then by online status
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    // Finally by username
    return a.username.localeCompare(b.username);
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {isMobile && (
        <div className="p-4 border-b dark:border-gray-700">
          <Button onClick={onClose} variant="ghost" className="w-full justify-start">
            ← Back to Chat
          </Button>
        </div>
      )}

      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">
          Users ({users.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedUsers.map((user) => (
          <motion.div
            key={user.username}
            initial={isMobile ? { x: 20, opacity: 0 } : false}
            animate={isMobile ? { x: 0, opacity: 1 } : false}
            className={`p-4 flex items-center gap-3 border-b last:border-b-0 dark:border-gray-700 ${
              user.username === currentUsername ? 'bg-amber-50 dark:bg-amber-900/20' : ''
            }`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: user.color || '#4B5563' }}
            >
              {user.isModerator ? (
                <Crown className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {user.username}
                  {user.username === currentUsername && ' (You)'}
                </span>
                {user.isModerator && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    Mod
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  user.isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {user.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {isModerator && user.username !== currentUsername && !user.isModerator && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => user.isMuted ? onUnmuteUser(user.username) : onMuteUser(user.username)}
                className="h-8 w-8 p-0"
              >
                {user.isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}