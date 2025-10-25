import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

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
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-primary)] p-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--color-secondary)] dark:bg-[var(--color-primary)] p-8 rounded-lg shadow-2xl max-w-md w-full border border-[var(--color-accent)]/40"
      >
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--color-primary)] dark:text-[var(--color-accent)]">
          Welcome to Study Room Chat
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
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
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:bg-[#3a5656] dark:border-[var(--color-primary)]"
              placeholder="Enter your username"
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-[var(--text-light)] hover:opacity-90"
          >
            Join Chat
          </Button>
        </form>

        <p className="mt-4 text-sm text-[var(--color-primary)] dark:text-[var(--color-accent)] text-center">
          By joining, you agree to be respectful to others.
        </p>
      </motion.div>
    </div>
  );
}