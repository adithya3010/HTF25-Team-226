import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import io from "socket.io-client";
import { MessageCircle, Moon, Sun, Users, Wifi, WifiOff } from "lucide-react";

import { UsernamePrompt } from "./UsernamePrompt";
import { ChatWindow } from "./ChatWindow";
import { MessageInput } from "./MessageInput";
import { UserSidebar } from "./UserSidebar";
import { useSocket } from "../hooks/useSocket";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Toaster } from "./ui/sonner";
import { RoomList } from "./RoomList";
import { useAuth } from "./auth/AuthProvider";

export default function ChatApp() {
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
    socket,
    sendMessage,
    emitTyping,
    emitStopTyping,
    deleteMessage,
    pinMessage,
    muteUser,
    unmuteUser,
    blockUser,
    unblockUser,
    editMessage,
  } = useSocket(username, currentRoom?._id);

  const currentUser = users.find((u) => u.username === username);
  const isModerator = currentUser?.isModerator || false;
  const isMuted = currentUser?.isMuted || false;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!username) return;

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
      });

    if (socket) {
      socket.on("roomCreated", (newRoom) => {
        setRooms((prev) => {
          if (prev.some((r) => r._id === newRoom._id)) return prev;
          return [...prev, newRoom];
        });
      });

      return () => {
        socket.off("roomCreated");
      };
    }
  }, [username, socket]);

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

  const { user } = useAuth();
  
  // Use authenticated user's information
  useEffect(() => {
    if (user && !username) {
      setUsername(user.username);
    }
  }, [user, username]);

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
    <div className="h-[92vh] flex flex-row">
      <Toaster position="top-right" />

      <motion.header
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-32 bg-[var(--color-secondary)] text-[var(--text-light)] p-4 shadow-lg border-r-2 border-indigo-800/50 flex flex-col justify-between h-full"
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm mb-3">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div className="text-center mb-4">
            <h1 className="text-[var(--text-light)] text-lg font-semibold">{currentRoom.name}</h1>
            <p className="text-xs text-white/80 mt-1">Welcome, {username}!</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-2 bg-white/20 px-3 py-2 rounded-full backdrop-blur-sm">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-300" />
                <span className="text-xs text-[var(--text-light)]">
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-300" />
                <span className="text-xs text-[var(--text-light)]">
                  Disconnected
                </span>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentRoom(null)}
            className="w-full h-10 hover:bg-white/20 text-white"
          >
            Leave Room
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full h-10 hover:bg-white/20 text-white mb-2"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 mr-2" />
            ) : (
              <Moon className="w-5 h-5 mr-2" />
            )}
            {isDarkMode ? 'Light' : 'Dark'}
          </Button>

          {isMobile && (
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-10 hover:bg-white/20 text-white"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Users ({users.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-80">
                <UserSidebar
                  users={users}
                  currentUsername={username}
                  isModerator={isModerator}
                  onMuteUser={muteUser}
                  onUnmuteUser={unmuteUser}
                  onBlockUser={blockUser}
                  onUnblockUser={unblockUser}
                  onClose={() => setIsSidebarOpen(false)}
                  isMobile={true}
                  socket={socket}
                />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <ChatWindow
              messages={messages}
              currentUsername={username}
              typingUsers={typingUsers}
              isModerator={isModerator}
              onDeleteMessage={deleteMessage}
              onPinMessage={pinMessage}
              onEditMessage={editMessage}
              socket={socket}
              roomId={currentRoom._id}
            />
            <MessageInput
              onSendMessage={sendMessage}
              onTyping={emitTyping}
              onStopTyping={emitStopTyping}
              isMuted={isMuted}
            />
          </div>

          {!isMobile && (
            <div className="w-80 border-l-2 border-indigo-800/50">
              <UserSidebar
                users={users}
                currentUsername={username}
                isModerator={isModerator}
                onMuteUser={muteUser}
                onUnmuteUser={unmuteUser}
                onBlockUser={blockUser}
                onUnblockUser={unblockUser}
                socket={socket}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
