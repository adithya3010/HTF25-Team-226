import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignIn } from "./components/auth/SignIn";
import ChatApp from "./components/ChatApp";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import { ModeratorSettings } from "./components/ModeratorSettings";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mod-settings"
          element={
            <ProtectedRoute>
              <ModeratorSettings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
