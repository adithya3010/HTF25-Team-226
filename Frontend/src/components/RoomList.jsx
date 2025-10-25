import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BackgroundOverlay from './BackgroundOverlay';

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
        <div className="relative h-full w-full">
                <BackgroundOverlay />
            <div className="h-full relative z-10 flex flex-col bg-white/10 dark:bg-slate-950/50 rounded-lg overflow-hidden backdrop-blur-xl border border-white/20">

                <div className="p-4 border-b border-white/10 dark:border-slate-800/50">
                    <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Chat Rooms</h2>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-900 text-white hover:from-indigo-700 hover:to-indigo-950 transition-all duration-300 border border-indigo-700/20 shadow-lg shadow-indigo-950/20"
                        disabled={isCreating || isSubmitting}
                    >
                        <Plus className="w-5 h-5 mr-2" />
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
                            className="p-4 border-b border-white/10 dark:border-slate-800/50 bg-black/10 dark:bg-slate-900/50 backdrop-blur-sm"
                        >
                            <input
                                type="text"
                                value={newRoomName}
                                onChange={(e) => {
                                    setNewRoomName(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Room name..."
                                className={`w-full px-4 py-3 rounded-lg border bg-white/10 dark:bg-slate-950/50 text-white placeholder-white/50 backdrop-blur-xl transition-all duration-200 hover:bg-white/20 dark:hover:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${error ? 'border-red-500' : 'border-white/10 dark:border-slate-800/50'
                                    }`}
                                disabled={isSubmitting}
                                autoFocus
                            />
                            {error && (
                                <p className="text-sm text-red-400 mt-2 flex items-center">
                                    <span className="bg-red-500/10 p-1 rounded-full mr-2">⚠</span>
                                    {error}
                                </p>
                            )}
                            <div className="flex gap-2 mt-4">
                                <Button
                                    type="submit"
                                    disabled={!newRoomName.trim() || isSubmitting}
                                    className="bg-gradient-to-r from-indigo-600 to-indigo-900 text-white hover:from-indigo-700 hover:to-indigo-950 transition-all duration-300 shadow-lg shadow-indigo-950/20"
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
                                    className="text-white hover:bg-white/10"
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
                                className={`p-4 flex items-center gap-3 border-b border-white/10 cursor-pointer last:border-b-0 transition-all duration-200 hover:bg-white/5 dark:hover:bg-slate-800/50 backdrop-blur-sm ${room._id === currentRoom?._id ? 'bg-indigo-500/10 dark:bg-indigo-950/50' : ''
                                    }`}
                                onClick={() => onRoomSelect(room)}
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-white/90">{room.name}</div>
                                    <div className="text-sm text-white/70">
                                        Created by {room.createdBy}
                                    </div>
                                    <div className="text-xs text-white/50">
                                        {new Date(room.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {rooms.length === 0 && (
                        <div className="p-8 text-center text-white/50">
                            No rooms available. Create one to get started!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}