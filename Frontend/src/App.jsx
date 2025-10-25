import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UsernamePrompt } from "./components/UsernamePrompt";
import { ChatWindow } from "./components/ChatWindow";
import { MessageInput } from "./components/MessageInput";
import { UserSidebar } from "./components/UserSidebar";
import { useSocket } from "./hooks/useSocket";
import io from "socket.io-client";
import { Button } from "./components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";
import { Toaster } from "./components/ui/sonner";
import { RoomList } from "./components/RoomList";
import { MessageCircle, Moon, Sun, Users, Wifi, WifiOff } from "lucide-react";
import LandingPage from "./components/LandingPage";
import { Routes, Route } from "react-router-dom";
import  Navbar  from "./components/Navbar";

export function ChatApp() {
  const [username, setUsername] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
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
    unmuteUser,
  } = useSocket(username, currentRoom?._id);

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
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Load rooms and listen for new rooms
  useEffect(() => {
    if (!username) return;

    // Load initial rooms
    fetch("http://localhost:3001/api/rooms")
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          throw new Error(error);
        }
        return res.json();
      })
      .then(setRooms)
      .catch((error) => {
        console.error("Failed to load rooms:", error);
        // silent fallback; toast may be available in project
      });

    // Listen for new rooms
    const socket = io("http://localhost:3001");
    socket.on("roomCreated", (newRoom) => {
      setRooms((prev) => {
        // Avoid duplicates
        if (prev.some((r) => r._id === newRoom._id)) return prev;
        return [...prev, newRoom];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  const handleCreateRoom = async (name) => {
    try {
      const response = await fetch("http://localhost:3001/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, createdBy: username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create room");
      }

      const newRoom = await response.json();
      setRooms((prev) => [...prev, newRoom]);
      return newRoom;
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  if (!username) {
    return <UsernamePrompt onSubmit={setUsername} />;
  }

  if (!currentRoom) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <RoomList
            rooms={rooms}
            currentRoom={currentRoom}
            onRoomSelect={setCurrentRoom}
            onCreateRoom={handleCreateRoom}
          />
        </div>
      </div>
    );
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
              <h1 className="text-[var(--text-light)]">{currentRoom.name}</h1>
              <p className="text-xs text-white/80">Welcome, {username}!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-300" />
                  <span className="text-xs text-[var(--text-light)] hidden sm:inline">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-300" />
                  <span className="text-xs text-[var(--text-light)] hidden sm:inline">
                    Disconnected
                  </span>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentRoom(null)}
              className="h-10 px-3 hover:bg-white/20 text-white mr-2"
            >
              Leave Room
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-10 w-10 p-0 hover:bg-white/20 text-white"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
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

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="/*" element={<ChatApp />} />
      </Routes>
    </>
  );
}
