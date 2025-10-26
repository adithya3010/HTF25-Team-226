import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { toast } from 'sonner';

export function useSocket(username, roomId) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!username || !roomId) return;

    const newSocket = io('http://localhost:3001', {
      query: { username, roomId },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to chat server', {
        description: `Joined room as ${username}`,
        duration: 3000,
        style: { 
          background: '#000000',
          color: '#ffffff'
        }
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from chat server', {
        description: 'Attempting to reconnect...',
        duration: 4000,
        style: { 
          background: '#000000',
          color: '#ffffff'
        }
      });
    });

    newSocket.on('connect_error', (error) => {
      toast.error('Failed to connect', {
        description: 'Please check your internet connection',
        duration: 4000,
        style: { 
          background: '#000000',
          color: '#ffffff'
        }
      });
    });

    // Message events
    newSocket.on('message history', (history) => {
      if (Array.isArray(history)) {
        // Filter out null messages and sort by timestamp
        const validMessages = history
          .filter(msg => msg && msg.timestamp)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(validMessages);
      }
    });

    newSocket.on('message', (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    newSocket.on('messageDeleted', (messageId) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, isDeleted: true } : m
      ));
      toast.info('A message was deleted by a moderator', {
        style: { 
          background: '#000000',
          color: '#ffffff'
        }
      });
    });

    newSocket.on('messageEdited', ({ messageId, newText, editedAt, originalText }) => {
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { 
          ...m, 
          content: newText,
          editedAt,
          originalText
        } : m
      ));
    });

    newSocket.on('messagePinned', (messageId) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
        )
      );
    });

    // User events
    newSocket.on('users', (userList) => {
      setUsers(userList);
    });

    newSocket.on('userJoined', (username) => {
      toast.info(`${username} joined the chat`, {
        style: { 
          background: '#000000',
          color: '#ffffff'
        }
      });
      // Update user status to online if they exist in the list
      setUsers(prev => prev.map(u => 
        u.username === username 
          ? { ...u, isOnline: true, lastSeen: new Date().toISOString() }
          : u
      ));
    });

    newSocket.on('userLeft', ({ username, lastSeen }) => {
      toast.info(`${username} left the chat`, {
        style: { 
          background: '#000000',
          color: '#ffffff'
        }
      });
      setUsers(prev => prev.map(u => 
        u.username === username 
          ? { ...u, isOnline: false, lastSeen }
          : u
      ));
    });

    newSocket.on('userMuted', (mutedUsername) => {
      toast.warning(`${mutedUsername} was muted`, {
        style: { 
          background: '#000000',
          color: '#ffffff'
        }
      });
    });

    newSocket.on('userUnmuted', (unmutedUsername) => {
      toast.success(`${unmutedUsername} was unmuted`, {
        style: { 
          background: '#000000',
          color: '#ffffff'
        }
      });
    });

    // Typing events
    newSocket.on('userTyping', (typingUsername) => {
      setTypingUsers((prev) =>
        prev.includes(typingUsername) ? prev : [...prev, typingUsername]
      );
    });

    newSocket.on('userStoppedTyping', (typingUsername) => {
      setTypingUsers((prev) => prev.filter((u) => u !== typingUsername));
    });

    // Private message events - show notification when receiving private message
    newSocket.on('privateMessage', (message) => {
      // Only show notification if message is from someone else
      if (message.from !== username) {
        toast.message(`💬 ${message.from}`, {
          description: message.content,
          duration: 5000,
          style: { 
            background: '#1e1b4b',
            color: '#ffffff',
            border: '1px solid #6366f1'
          },
          action: {
            label: 'Reply',
            onClick: () => {
              // Emit custom event to open chat
              window.dispatchEvent(new CustomEvent('openPrivateChat', { 
                detail: { username: message.from }
              }));
            }
          }
        });

        // Play notification sound (optional)
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Ignore if audio play fails
          });
        } catch (e) {
          // Ignore audio errors
        }
      }
    });

    return () => {
      newSocket.disconnect();
      setMessages([]);
      setUsers([]);
      setTypingUsers([]);
      setIsConnected(false);
    };
  }, [username, roomId]);

  // Message actions
  const sendMessage = (content) => {
    if (socket) {
      socket.emit('message', content);
    }
  };

  const deleteMessage = (messageId) => {
    if (socket) {
      socket.emit('deleteMessage', messageId);
    }
  };

  const pinMessage = (messageId) => {
    if (socket) {
      socket.emit('pinMessage', messageId);
    }
  };

  const editMessage = (messageId, newText) => {
    if (socket) {
      socket.emit('editMessage', { messageId, newText });
    }
  };

  // User actions
  const muteUser = (userToMute) => {
    if (socket) {
      socket.emit('muteUser', userToMute);
    }
  };

  const unmuteUser = (userToUnmute) => {
    if (socket) {
      socket.emit('unmuteUser', userToUnmute);
    }
  };

  // Typing actions
  const emitTyping = () => {
    if (socket) {
      socket.emit('typing');
    }
  };

  const emitStopTyping = () => {
    if (socket) {
      socket.emit('stopTyping');
    }
  };

  return {
    isConnected,
    messages,
    users,
    socket,
    typingUsers,
    sendMessage,
    deleteMessage,
    pinMessage,
    editMessage,
    muteUser,
    unmuteUser,
    emitTyping,
    emitStopTyping
  };
}