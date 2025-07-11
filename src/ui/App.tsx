import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Loader } from "./components/ui/Loader"; // create a spinner loader

// Pages
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
const ChatPage = React.lazy(() => import("./pages/ChatPage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));



const App = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />; // Wait for /me check

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public Route */}
        <Route
          path="/register"
          element={!user ? <RegisterPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/chat" replace />}
        />
        {/* Protected Routes */}
        <Route
          path="/chat"
          element={user ? <ChatPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={
            user?.role === "ADMIN" ? (
              <AdminPage />
            ) : (
              <Navigate to="/chat" replace />
            )
          }
        />

        {/* Default + 404 */}
        <Route
          path="/"
          element={<Navigate to={user ? "/chat" : "/login"} replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;
