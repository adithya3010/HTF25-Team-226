import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import BackgroundOverlay from './BackgroundOverlay';

export function UsernamePrompt({ onSubmit }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    onSubmit(username);
  };

  return (
    <div className="relative h-full w-full">
      <BackgroundOverlay />
      <div className="min-h-screen relative z-10 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/10 dark:bg-slate-950/50 z-10 p-8 rounded-xl shadow-2xl max-w-md w-full border border-white/20 backdrop-blur-md"
        >
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-center mb-8 text-white dark:text-white bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent"
          >
            Welcome to Study Room Chat
          </motion.h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2 text-white/90 dark:text-white/90">
                Choose a username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white/10 dark:bg-slate-950/50 text-white placeholder-white/50 border-white/10 backdrop-blur-xl transition-all duration-200 hover:bg-white/20 dark:hover:bg-slate-900/50"
                placeholder="Enter your username"
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm mt-2 flex items-center"
                >
                  <span className="bg-red-500/10 p-1 rounded-full mr-2">⚠</span>
                  {error}
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-900 text-white hover:from-indigo-700 hover:to-indigo-950 transition-all duration-300 hover:scale-[1.02] font-medium tracking-wide py-3 rounded-lg shadow-lg shadow-indigo-950/30 border border-indigo-700/20 backdrop-blur-xl relative overflow-hidden group"
            >
              <span className="relative z-10">Join Chat</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </form>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-sm text-white/70 dark:text-white/70 text-center"
          >
            By joining, you agree to be respectful to others.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}