import { useState, useEffect } from 'react';
import { useModeratorGuard } from '../hooks/useModeratorGuard';
import { Button } from './ui/button';
import { Shield, UserCheck, UserX } from 'lucide-react';

export function ModeratorSettings() {
  const isModerator = useModeratorGuard();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isModerator) return;

    fetch('http://localhost:3001/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch users:', error);
        setLoading(false);
      });
  }, [isModerator]);

  const toggleModeratorStatus = async (userId, makeModarator) => {
    try {
      const endpoint = makeModarator ? 'make-moderator' : 'remove-moderator';
      const response = await fetch(`http://localhost:3001/api/users/${endpoint}/${userId}`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to update moderator status');

      // Update local state
      setUsers(users.map(user => {
        if (user._id === userId) {
          return {
            ...user,
            isModerator: makeModarator,
            roles: makeModarator 
              ? [...new Set([...user.roles, 'moderator'])]
              : user.roles.filter(r => r !== 'moderator')
          };
        }
        return user;
      }));
    } catch (error) {
      console.error('Error updating moderator status:', error);
    }
  };

  if (!isModerator) return null;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-950 via-black to-indigo-950 rounded-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-semibold text-white">Moderator Settings</h2>
      </div>

      <div className="space-y-4">
        {users.map(user => (
          <div 
            key={user._id}
            className="flex items-center justify-between p-4 bg-white/5 rounded-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="text-white font-medium">{user.name}</div>
                <div className="text-sm text-white/60">{user.email}</div>
              </div>
            </div>

            {user.isModerator ? (
              <Button
                variant="ghost"
                className="hover:bg-red-500/20 text-red-400"
                onClick={() => toggleModeratorStatus(user._id, false)}
              >
                <UserX className="w-4 h-4 mr-2" />
                Remove Moderator
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="hover:bg-indigo-500/20 text-indigo-400"
                onClick={() => toggleModeratorStatus(user._id, true)}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Make Moderator
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}