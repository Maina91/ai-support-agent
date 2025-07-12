// src/main.tsx or index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { useInitTheme } from "./hooks/useInitTheme"; // should be called in layout if used
import { AuthProvider } from "./auth/AuthProvider";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import App from "./App";
import "./styles/globals.css";

const rootElement = document.getElementById("root")!;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
