import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';

export function MessageInput({ onSendMessage, onTyping, onStopTyping, isMuted }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]); // File[]
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleTyping = () => {
    onTyping();
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = message.trim();
    const hasFiles = files.length > 0;
    if (!trimmed && !hasFiles) return;

    try {
      // Send images as data URLs so the server still receives strings
      for (const f of files) {
        const dataUrl = await readFileAsDataUrl(f);
        onSendMessage(String(dataUrl));
      }

      if (trimmed) {
        onSendMessage(trimmed);
      }

      setMessage('');
      setFiles([]);
      setShowEmoji(false);
      onStopTyping();
    } catch (err) {
      toast.error('Failed to attach file');
    }
  };

  const onEmojiSelect = (emoji) => {
    const char = emoji?.emoji || '';
    if (!char) return;
    const el = inputRef.current;
    if (!el) {
      setMessage((prev) => prev + char);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const next = message.slice(0, start) + char + message.slice(end);
    setMessage(next);
    // Restore caret after state update
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + char.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const onFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const valid = [];
    for (const f of selected) {
      const isImage = f.type.startsWith('image/');
      const withinSize = f.size <= 5 * 1024 * 1024; // 5MB
      if (!isImage) {
        toast.warning(`${f.name} is not an image. Only images are supported.`);
        continue;
      }
      if (!withinSize) {
        toast.warning(`${f.name} is too large (max 5MB).`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid]);
    // Reset input so same file can be chosen again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-[var(--color-accent)]/40 bg-[var(--color-secondary)] dark:bg-[var(--color-primary)]"
    >
      {/* Selected files preview */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, idx) => (
            <div
              key={`${f.name}-${idx}`}
              className="flex items-center gap-2 rounded-full bg-[var(--color-accent)]/30 text-[var(--text-dark)] dark:bg-[var(--color-notify)]/25 dark:text-[var(--text-light)] px-3 py-1"
            >
              <span className="text-xs max-w-[12rem] truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="rounded-full p-0.5 hover:bg-[var(--color-accent)]/50 dark:hover:bg-[var(--color-notify)]/40"
                aria-label={`Remove ${f.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Emoji toggle */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowEmoji((v) => !v)}
            disabled={isMuted}
            className="rounded-full"
            aria-label="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </Button>

          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-20">
              <div className="shadow-lg border dark:border-gray-700 rounded-xl overflow-hidden">
                <EmojiPicker
                  onEmojiClick={(emojiData) => onEmojiSelect(emojiData)}
                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                  lazyLoadEmojis
                  width={320}
                />
              </div>
            </div>
          )}
        </div>

        {/* File picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFileChange}
          className="hidden"
          disabled={isMuted}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isMuted}
          className="rounded-full"
          aria-label="Attach image"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder={isMuted ? 'You are muted' : 'Type a message...'}
          disabled={isMuted}
          className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#D2B48C] dark:bg-[#3a5656] dark:border-[#2F4F4F]"
        />

        {/* Send */}
        <Button
          type="submit"
          disabled={(message.trim() === '' && files.length === 0) || isMuted}
          className="rounded-full px-6 bg-[var(--color-primary)] text-[var(--text-light)] hover:opacity-90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}