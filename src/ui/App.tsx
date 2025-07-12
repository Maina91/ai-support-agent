// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import { DashboardPage } from "./pages/Dashboard";
import NotFoundPage from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";
import AgentDashboardPage from "./pages/AgentDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agent"
        element={
          <ProtectedRoute roles={["AGENT", "ADMIN"]}>
            <AgentDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
