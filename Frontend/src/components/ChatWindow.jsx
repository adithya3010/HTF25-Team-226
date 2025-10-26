import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

import { useState } from 'react';
import { Pencil } from 'lucide-react';

export function ChatWindow({ 
  messages, 
  currentUsername, 
  typingUsers, 
  isModerator,
  onDeleteMessage,
  onPinMessage,
  onEditMessage,
  socket,
  roomId
}) {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const renderMessageContent = (content) => {
    // Try parsing as JSON first (for PDFs)
    try {
      const parsedContent = JSON.parse(content);
      if (parsedContent.type === 'pdf') {
        // Extract the ID from the URL
        const pdfId = parsedContent.url.split('/').pop();
        return (
          <div className="flex flex-col gap-2">
            <a 
              href={parsedContent.url}
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-2 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all shadow-sm hover:shadow-md"
            >
              <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/50">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {parsedContent.filename}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {parsedContent.pages ? `${parsedContent.pages} pages · ` : ''}
                  {(parsedContent.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const pdfId = parsedContent.url.split('/').pop();
                      if (!pdfId) {
                        toast.error('Could not find PDF ID', {
                          style: { 
                            background: '#000000',
                            color: '#ffffff'
                          }
                        });
                        return;
                      }
                      socket.emit('summarizePdf', {
                        pdfId: pdfId,
                        roomId: roomId
                      });
                      toast.loading('Generating summary...', {
                        style: { 
                          background: '#000000',
                          color: '#ffffff'
                        },
                        description: 'This might take a few moments.'
                      });
                    }}
                    className="h-8 px-2 py-1 hover:bg-emerald-500/15 group text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-emerald-700 group-hover:text-emerald-800 transition-colors">
                      Summarize
                    </span>
                  </Button>
                </div>
                <a 
                  href={parsedContent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2 py-1 hover:bg-blue-500/15 group text-sm flex items-center gap-1 rounded-md"
                >
                  <svg className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-blue-600 group-hover:text-blue-700 transition-colors">
                    Open PDF
                  </span>
                </a>
              </div>
            </a>
          </div>
        );
      }
    } catch {}

    // Handle other file types
    if (content.startsWith('data:image/')) {
      return (
        <div className="group relative inline-block">
          <img
            src={content}
            alt="attachment"
            className="max-w-xs md:max-w-sm rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 ease-in-out transform group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>
      );
    } else if (content.includes('"type":"video"')) {
      try {
        const videoInfo = JSON.parse(content);
        return (
          <div className="group relative inline-block">
            <div className="max-w-xs md:max-w-sm rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {videoInfo.filename}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {(videoInfo.size / (1024 * 1024)).toFixed(1)} MB · {videoInfo.mimeType || 'Video'}
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-lg">
                <video 
                  controls 
                  src={videoInfo.url}
                  className="w-full rounded-lg" 
                  preload="metadata"
                />
                <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
              </div>
            </div>
          </div>
        );
      } catch {
        return <p className="text-red-500">Invalid video message format</p>;
      }
    } else if (content.includes('"type":"audio"')) {
      try {
        const audioInfo = JSON.parse(content);
        return (
          <div className="max-w-sm group">
            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {audioInfo.filename}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {(audioInfo.size / (1024 * 1024)).toFixed(1)} MB · {audioInfo.mimeType || 'Audio'}
                  </div>
                </div>
              </div>
              <div className="relative">
                <audio 
                  controls 
                  src={audioInfo.data}
                  className="w-full rounded border border-gray-200 dark:border-gray-700 [&::-webkit-media-controls-panel]:bg-white/95 dark:[&::-webkit-media-controls-panel]:bg-gray-800/95 [&::-webkit-media-controls-current-time-display]:text-gray-700 dark:[&::-webkit-media-controls-current-time-display]:text-gray-300 [&::-webkit-media-controls-time-remaining-display]:text-gray-700 dark:[&::-webkit-media-controls-time-remaining-display]:text-gray-300"
                />
                <div className="absolute inset-0 rounded bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors pointer-events-none" />
              </div>
            </div>
          </div>
        );
      } catch {
        return <p className="text-red-500">Invalid audio message format</p>;
      }
    }
    
    // Default text message
    return (
      <div className="whitespace-pre-wrap break-words max-w-[65ch] overflow-wrap-anywhere hyphens-auto">
        {content}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="sticky top-0 flex justify-center">
            <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400">
              {date}
            </span>
          </div>

          <div className="space-y-4 mt-4">
            {dateMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 items-start ${
                  message.username === currentUsername ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                  style={{
                    backgroundColor: message.userColor || '#4B5563',
                  }}
                >
                  {message.username[0].toUpperCase()}
                </div>

                <div className={`flex-1 space-y-1 ${
                  message.username === currentUsername ? 'items-end' : 'items-start'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {message.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className={`relative group flex items-start gap-2 ${
                    message.username === currentUsername ? 'flex-row-reverse' : ''
                  }`}>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[85%] break-words ${
                        message.isPinned
                          ? 'bg-[#8FBC8F] text-[#1A1A1A] ring-2 ring-[#2F4F4F]'
                          : message.username === currentUsername
                          ? 'bg-[#4E6E5D] text-[#F9F9F9]'
                          : 'bg-[#F3F2ED] text-[#1A1A1A]'
                      }`}
                    >
                      {message.isPinned && (
                        <div className="flex items-center gap-1 mb-1 text-[#2F4F4F] font-medium">
                          <Pin className="w-3 h-3 fill-current" />
                          <span className="text-xs">Pinned Message</span>
                        </div>
                      )}
                      {typeof message.content === 'string' && renderMessageContent(message.content)}
                      {message.editedAt && (
                        <div className="mt-1 flex items-center gap-1">
                          <Pencil className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400">
                            edited {new Date(message.editedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Message Actions */}
                    <div className={`absolute top-0 ${
                      message.username === currentUsername ? 'left-0' : 'right-0'
                    } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                      {/* Edit button - only shown for user's own messages that aren't deleted */}
                      {message.username === currentUsername && !message.isDeleted && !editingMessageId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditText(message.content);
                          }}
                          className="h-8 w-8 p-0 hover:bg-blue-500/15"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}

                      {isModerator && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPinMessage(message.id)}
                            className="h-8 w-8 p-0 hover:bg-[#8FBC8F]/30"
                          >
                            <Pin className={`w-4 h-4 ${
                              message.isPinned ? 'text-[#2F4F4F]' : ''
                            }`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteMessage(message.id)}
                            className="h-8 w-8 p-0 hover:bg-[#C94F4F]/15"
                          >
                            <Trash2 className="w-4 h-4 text-[#C94F4F]" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Edit Message Form */}
                    {editingMessageId === message.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="flex-1 min-w-0 rounded-md border border-gray-200 
                                   bg-white text-black px-3 py-2 text-sm focus:outline-none 
                                   focus:ring-2 focus:ring-blue-500 shadow-sm"
                          placeholder="Edit your message..."
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              onEditMessage(message.id, editText);
                              setEditingMessageId(null);
                              setEditText('');
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditText('');
                            }
                          }}
                        />
                          <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                          onClick={() => {
                            onEditMessage(message.id, editText);
                            setEditingMessageId(null);
                            setEditText('');
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-gray-100"
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {typingUsers.filter(user => user !== currentUsername).join(', ')}
          {' is typing...'}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}