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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
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
                      {typeof message.content === 'string' && message.content.startsWith('data:image/') ? (
                        <img
                          src={message.content}
                          alt="attachment"
                          className="max-w-xs md:max-w-sm rounded-md border border-black/10"
                        />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      )}
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