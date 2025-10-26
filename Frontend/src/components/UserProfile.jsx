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

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setFormData({
      username: user?.username || '',
      name: user?.name || '',
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative group p-0 w-10 h-10 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2">
          <img
            src={user?.picture}
            alt={user?.name || "User avatar"}
            className="w-full h-full rounded-full object-cover"
          />
        </Button>
      </SheetTrigger>
      {/* ✅ Sheet Background & Text: Changed default to black background (bg-black) and white text (text-white) */}
      <SheetContent className="sm:max-w-md bg-black text-white dark:bg-slate-900 dark:text-gray-50">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">Your Profile</SheetTitle>
        </SheetHeader>

        <div className="py-2">
          {isEditing ? (
            // --- EDITING VIEW ---
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Edit Details</h3>
              
              {/* Username Field */}
              <div className='space-y-1'>
                {/* Text color changed to light gray for labels on a dark background */}
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 dark:text-gray-300">Username</label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    setError('');
                  }}
                  placeholder="Choose a unique username"
                  // ✅ Input Background Changed: Dark gray input, white text
                  className={`w-full p-2 rounded-md border text-base shadow-sm
                    bg-gray-900 text-white dark:bg-slate-800 dark:text-white
                    focus:outline-none focus:ring-2 
                    ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 dark:border-slate-700 focus:ring-primary'}
                  `}
                />
                <p className="mt-1 text-sm text-red-400 dark:text-red-500">{error}</p>
              </div>

              {/* Display Name Field */}
              <div className='space-y-1'>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 dark:text-gray-300">Display Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your preferred display name"
                  // ✅ Input Background Changed: Dark gray input, white text
                  className="w-full p-2 rounded-md border bg-gray-900 text-white dark:bg-slate-800 dark:text-white border-gray-700 dark:border-slate-700 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Save Changes</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            // --- VIEWING MODE ---
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-28 h-28">
                  <img
                    src={user?.picture}
                    alt={user?.name || "User avatar"}
                    // ✅ Avatar Border Changed: Matches the new black background color
                    className="w-full h-full rounded-full object-cover border-4 border-black dark:border-slate-900 shadow-lg"
                  />
                </div>
                <div className="text-center">
                    <p className="text-xl font-bold">{user?.name || user?.username}</p>
                    {/* Secondary text color adjusted for better contrast on a black background */}
                    <p className="text-sm text-gray-400 dark:text-gray-400">@{user?.username}</p>
                </div>
              </div>

              {/* Profile Details */}
              {/* Border color adjusted for contrast */}
              <div className="space-y-5 border-t pt-6 border-gray-800 dark:border-gray-700">
                
                {/* Email */}
                <div>
                  {/* Label color adjusted */}
                  <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-400 mb-1">
                    Email Address
                  </label>
                  <p className="text-base font-medium truncate">{user?.email || 'Not provided'}</p>
                </div>

                {/* Username */}
                {user?.name && (
                    <div>
                        {/* Label color adjusted */}
                        <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-400 mb-1">
                            Username
                        </label>
                        <p className="text-base font-medium">{user?.username}</p>
                    </div>
                )}
              </div>

              {/* Edit Button */}
              <div className="pt-4">
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  Edit Profile
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}