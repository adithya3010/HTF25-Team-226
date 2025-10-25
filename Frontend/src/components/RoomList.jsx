import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RoomList({ rooms, currentRoom, onRoomSelect, onCreateRoom }) {
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateRoom(name);
      setNewRoomName('');
      setIsCreating(false);
      toast.success('Room created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create room');
      toast.error(err.message || 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Chat Rooms</h2>
        <Button 
          onClick={() => setIsCreating(true)} 
          className="w-full"
          variant="outline"
          disabled={isCreating || isSubmitting}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Room
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreateRoom}
            className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          >
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => {
                setNewRoomName(e.target.value);
                setError(null);
              }}
              placeholder="Room name..."
              className={`w-full p-2 mb-2 rounded border dark:border-gray-600 dark:bg-gray-800 ${
                error ? 'border-red-500' : ''
              }`}
              disabled={isSubmitting}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={!newRoomName.trim() || isSubmitting}
                className="relative"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {rooms.map((room) => (
            <motion.div
              key={room._id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className={`p-4 flex items-center gap-3 border-b cursor-pointer last:border-b-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                room._id === currentRoom?._id ? 'bg-amber-50 dark:bg-amber-900/20' : ''
              }`}
              onClick={() => onRoomSelect(room)}
            >
              <div className="flex-1">
                <div className="font-medium">{room.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Created by {room.createdBy}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(room.createdAt).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {rooms.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No rooms available. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}