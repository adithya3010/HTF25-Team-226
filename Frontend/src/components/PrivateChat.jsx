import React, { useState, useEffect, useRef } from 'react';
import { formatRelativeTime } from '../utils/format';
import { X, Send } from 'lucide-react';
import { Button } from './ui/button';

export const PrivateChat = ({ socket, currentUsername, recipient, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (socket && recipient) {
            // Load message history
            socket.emit('getPrivateMessages', { withUser: recipient });

            // Listen for new private messages
            const handlePrivateMessage = (message) => {
                if (message.from === recipient || message.to === recipient) {
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === message.id)) {
                            return prev;
                        }
                        return [...prev, message];
                    });
                }
            };

            // Handle message history
            const handleMessageHistory = ({ withUser, messages: history }) => {
                if (withUser === recipient) {
                    setMessages(history);
                }
            };

            socket.on('privateMessage', handlePrivateMessage);
            socket.on('privateMessageHistory', handleMessageHistory);

            return () => {
                socket.off('privateMessage', handlePrivateMessage);
                socket.off('privateMessageHistory', handleMessageHistory);
            };
        }
    }, [socket, recipient, currentUsername]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !socket) return;

        socket.emit('privateMessage', {
            to: recipient,
            content: inputMessage.trim()
        });
        setInputMessage('');
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-gradient-to-br from-slate-900 via-black to-indigo-900 rounded-lg shadow-2xl border border-indigo-500/30 flex flex-col z-50">
            {/* Header */}
            <div className="p-4 border-b border-indigo-500/30 flex justify-between items-center bg-black/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-white">{recipient}</h3>
                </div>
                <Button 
                    onClick={onClose} 
                    variant="ghost" 
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-indigo-500/20"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-indigo-500/50 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>No messages yet. Start a conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isFromMe = msg.from === currentUsername;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${
                                    isFromMe ? 'items-end' : 'items-start'
                                }`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${
                                        isFromMe
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-800 text-gray-100'
                                    }`}
                                >
                                    <p className="text-sm break-words">{msg.content}</p>
                                </div>
                                <span className="text-xs text-gray-500 mt-1">
                                    {formatRelativeTime(new Date(msg.timestamp))}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-indigo-500/30 bg-black/50">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 bg-gray-900 border border-indigo-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500"
                    />
                    <Button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
};
