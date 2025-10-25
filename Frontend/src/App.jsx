import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UsernamePrompt } from './components/UsernamePrompt';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { UserSidebar } from './components/UserSidebar';
import { useSocket } from './hooks/useSocket';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { Toaster } from './components/ui/sonner';
import { MessageCircle, Moon, Sun, Users, Wifi, WifiOff } from 'lucide-react';

export default function App() {
  const [username, setUsername] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    messages,
    users,
    typingUsers,
    isConnected,
    sendMessage,
    emitTyping,
    emitStopTyping,
    deleteMessage,
    pinMessage,
    muteUser,
    unmuteUser
  } = useSocket(username);

  // Check if current user is a moderator
  const currentUser = users.find((u) => u.username === username);
  const isModerator = currentUser?.isModerator || false;
  const isMuted = currentUser?.isMuted || false;

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!username) {
    return <UsernamePrompt onSubmit={setUsername} />;
  }

  return (
    <div className="h-screen flex flex-col">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-[var(--color-primary)] text-[var(--text-light)] p-4 shadow-lg border-b-4 border-[var(--color-accent)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-[var(--text-light)]">Study Room Chat</h1>
              <p className="text-xs text-white/80">Welcome, {username}!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-300" />
                  <span className="text-xs text-[var(--text-light)] hidden sm:inline">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-300" />
                  <span className="text-xs text-[var(--text-light)] hidden sm:inline">Disconnected</span>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-10 w-10 p-0 hover:bg-white/20 text-white"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {isMobile && (
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 hover:bg-white/20 text-white"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    <span>{users.length}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-80">
                  <UserSidebar
                    users={users}
                    currentUsername={username}
                    isModerator={isModerator}
                    onMuteUser={muteUser}
                    onUnmuteUser={unmuteUser}
                    onClose={() => setIsSidebarOpen(false)}
                    isMobile={true}
                  />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow
            messages={messages}
            currentUsername={username}
            typingUsers={typingUsers}
            isModerator={isModerator}
            onDeleteMessage={deleteMessage}
            onPinMessage={pinMessage}
          />
          <MessageInput
            onSendMessage={sendMessage}
            onTyping={emitTyping}
            onStopTyping={emitStopTyping}
            isMuted={isMuted}
          />
        </div>

        {/* User Sidebar - Desktop Only */}
        {!isMobile && (
          <div className="w-80 border-l-2 border-[#D2B48C]">
            <UserSidebar
              users={users}
              currentUsername={username}
              isModerator={isModerator}
              onMuteUser={muteUser}
              onUnmuteUser={unmuteUser}
            />
          </div>
        )}
      </div>
    </div>
  );
}