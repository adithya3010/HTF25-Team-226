import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Pin, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

export function ChatWindow({ 
  messages, 
  currentUsername, 
  typingUsers, 
  isModerator,
  onDeleteMessage,
  onPinMessage
}) {
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
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
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
    } else if (content.startsWith('data:video/')) {
      return (
        <div className="group relative inline-block">
          <video 
            controls 
            src={content} 
            className="max-w-xs md:max-w-sm rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300" 
          />
          <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>
      );
    } else if (content.startsWith('data:audio/')) {
      return (
        <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
          <audio 
            controls 
            src={content} 
            className="w-full" 
          />
        </div>
      );
    }
    
    // Default text message
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
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
                      className={`rounded-lg px-4 py-2 ${
                        message.isPinned
                          ? 'bg-[#8FBC8F] text-[#1A1A1A]'
                          : message.username === currentUsername
                          ? 'bg-[#4E6E5D] text-[#F9F9F9]'
                          : 'bg-[#F3F2ED] text-[#1A1A1A]'
                      }`}
                    >
                      {typeof message.content === 'string' && renderMessageContent(message.content)}
                    </div>

                    {/* Message Actions */}
                    {isModerator && (
                      <div className={`absolute top-0 ${
                        message.username === currentUsername ? 'left-0' : 'right-0'
                      } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
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