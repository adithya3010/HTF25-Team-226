import { useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { motion } from 'framer-motion';

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    name: user?.name || '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate username
      if (formData.username.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return;
      }

      await updateUser({
        username: formData.username,
        name: formData.name
      });
      setError('');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.message || 'Failed to update profile');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative group">
          <img 
            src={user?.picture} 
            alt={user?.name} 
            className="w-8 h-8 rounded-full"
          />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Profile</SheetTitle>
        </SheetHeader>
        <div className="py-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    setError('');
                  }}
                  placeholder="Choose a username"
                  className={`w-full p-2 rounded border bg-white dark:bg-gray-800 ${
                    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit">Save Changes</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setFormData({
                      username: user?.username || '',
                      name: user?.name || '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <img 
                  src={user?.picture} 
                  alt={user?.name} 
                  className="w-24 h-24 rounded-full"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Username
                  </label>
                  <p className="text-lg">{user?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Display Name
                  </label>
                  <p className="text-lg">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="text-lg">{user?.email}</p>
                </div>
              </div>
              <Button onClick={() => setIsEditing(true)} className="w-full">
                Edit Profile
              </Button>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}