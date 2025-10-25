import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';

export function MessageInput({ onSendMessage, onTyping, onStopTyping, isMuted }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]); // { file: File, preview: string }
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
      // Send files as data URLs so the server still receives strings
      for (const item of files) {
        const f = item.file;
        const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          // upload to backend and send url
          try {
            const form = new FormData();
            form.append('file', f, f.name);

            // Show upload progress toast
            const progressToast = toast.loading(`Uploading ${f.name}...`, {
              description: '0%',
              duration: Infinity,
              style: { background: '#000000', color: '#ffffff' }
            });

            const resp = await fetch('http://localhost:3001/api/upload/pdf', {
              method: 'POST',
              body: form,
              // Add upload progress handling
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                toast.loading(`Uploading ${f.name}...`, {
                  id: progressToast,
                  description: `${percentCompleted}%`,
                  style: { background: '#000000', color: '#ffffff' }
                });
              }
            });

            if (!resp.ok) {
              toast.error(`Failed to upload ${f.name}`, {
                description: 'The server rejected the file',
                style: { background: '#000000', color: '#ffffff' }
              });
            } else {
              const json = await resp.json();
              const url = `http://localhost:3001${json.url}`;
              toast.success(`${f.name} uploaded successfully`, {
                description: 'PDF is now available in chat',
                style: { background: '#000000', color: '#ffffff' }
              });
              // Send a richer message for PDFs
              onSendMessage(JSON.stringify({
                type: 'pdf',
                url: url,
                filename: f.name,
                size: f.size,
                pages: json.pages // We'll add this to the backend response
              }));
            }
            toast.dismiss(progressToast);
          } catch (err) {
            toast.error(`Failed to upload ${f.name}`, {
              description: 'Check your connection and try again',
              style: { background: '#000000', color: '#ffffff' }
            });
          }
        } else {
          try {

            // Handle video files
            if (f.type.startsWith('video/')) {
              const form = new FormData();
              form.append('file', f, f.name);

              try {
                const progressToast = toast.loading(`Uploading ${f.name}...`, {
                  description: '0%',
                  duration: Infinity,
                  style: { background: '#000000', color: '#ffffff' }
                });

                const resp = await fetch('http://localhost:3001/api/upload/video', {
                  method: 'POST',
                  body: form
                });

                if (!resp.ok) {
                  throw new Error('Upload failed');
                }

                const json = await resp.json();
                const url = `http://localhost:3001${json.url}`;

                toast.success(`${f.name} uploaded successfully`, {
                  description: 'Video is now available in chat',
                  style: { background: '#000000', color: '#ffffff' }
                });

                onSendMessage(JSON.stringify({
                  type: 'video',
                  url: url,
                  filename: f.name,
                  size: f.size,
                  mimeType: f.type
                }));
              } catch (err) {
                toast.error(`Failed to upload ${f.name}`, {
                  description: 'Check your connection and try again',
                  style: { background: '#000000', color: '#ffffff' }
                });
              } finally {
                toast.dismiss(progressToast);
              }
            }
            // Handle audio files
            else if (f.type.startsWith('audio/')) {
              const dataUrl = await readFileAsDataUrl(f);
              onSendMessage(JSON.stringify({
                type: 'audio',
                data: dataUrl,
                filename: f.name,
                size: f.size,
                mimeType: f.type
              }));
            }
            // Handle other files (images)
            else {
              const dataUrl = await readFileAsDataUrl(f);
              onSendMessage(String(dataUrl));
            }

            if (!f.type.startsWith('video/')) {
              toast.success(`${f.name} processed successfully`, {
                style: { background: '#000000', color: '#ffffff' }
              });
            }
          } catch (err) {
            toast.error(`Failed to process ${f.name}`, {
              description: 'Check your file and try again',
              style: { background: '#000000', color: '#ffffff' }
            });
          }
        }
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
      const type = f.type || '';
      const name = f.name || '';
      const isImage = type.startsWith('image/');
      const isVideo = type.startsWith('video/');
      const isAudio = type.startsWith('audio/');
      const isPdf = type === 'application/pdf' || name.toLowerCase().endsWith('.pdf');

      // size limits per type
      const maxSizeMap = {
        image: 5 * 1024 * 1024,
        video: 20 * 1024 * 1024,
        audio: 10 * 1024 * 1024,
        pdf: 10 * 1024 * 1024,
      };

      let allowed = false;
      let maxSize = 5 * 1024 * 1024;
      if (isImage) {
        allowed = true;
        maxSize = maxSizeMap.image;
      } else if (isVideo) {
        allowed = true;
        maxSize = maxSizeMap.video;
      } else if (isAudio) {
        allowed = true;
        maxSize = maxSizeMap.audio;
      } else if (isPdf) {
        allowed = true;
        maxSize = maxSizeMap.pdf;
      }

      if (!allowed) {
        toast.warning(`${name} is not a supported file type.`);
        continue;
      }

      if (f.size > maxSize) {
        toast.warning(`${name} is too large (max ${Math.round(maxSize / (1024 * 1024))}MB).`);
        continue;
      }

      const preview = URL.createObjectURL(f);
      valid.push({ file: f, preview });
    }
    setFiles((prev) => [...prev, ...valid]);
    // Reset input so same file can be chosen again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => {
    setFiles((prev) => {
      const item = prev[idx];
      if (item && item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-[var(--color-secondary)] bg-[var(--color-secondary)] dark:bg-[var(--color-primary)]"
    >
      {/* Selected files preview */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((item, idx) => {
            const f = item.file;
            const preview = item.preview;
            const isImage = f.type.startsWith('image/');
            const isVideo = f.type.startsWith('video/');
            const isAudio = f.type.startsWith('audio/');
            const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

            return (
              <div
                key={`${f.name}-${idx}`}
                className="flex items-center gap-2 rounded-md bg-indigo-900/20 text-white px-3 py-2"
              >
                {isImage ? (
                  <img src={preview} alt={f.name} className="w-10 h-10 rounded-md object-cover" />
                ) : isVideo ? (
                  <video src={preview} className="w-16 h-10 rounded-md object-cover" />
                ) : isAudio ? (
                  <div className="w-16 h-10 flex items-center justify-center">🎵</div>
                ) : isPdf ? (
                  <div className="w-16 h-10 flex items-center justify-center">📄</div>
                ) : null}

                <span className="text-xs max-w-[12rem] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="rounded-full p-0.5 ml-2 hover:bg-indigo-800/50"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center  gap-2 text-white">
        {/* Emoji toggle */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowEmoji((v) => !v)}
            disabled={isMuted}
            className="rounded-full py-1"
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
          accept="image/*,video/*,audio/*,application/pdf"
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
          aria-label="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={message}
          rows="1"
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
            // Auto-adjust height
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (message.trim() || files.length > 0) {
                handleSubmit(e);
              }
            }
          }}
          placeholder={isMuted ? 'You are muted' : 'Type a message...'}
          disabled={isMuted}
          className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 resize-none min-h-[40px] max-h-[150px] overflow-y-auto"
        />

        {/* Send */}
        <Button
          type="submit"
          disabled={(message.trim() === '' && files.length === 0) || isMuted}
          className="rounded-full px-6 bg-gradient-to-r from-indigo-600 to-indigo-900 text-white hover:opacity-90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}