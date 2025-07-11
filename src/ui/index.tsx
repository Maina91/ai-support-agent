import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { useInitTheme } from "./hooks/useInitTheme";
import { AuthProvider } from "./context/AuthContext";
import App from './App';
import "./styles/globals.css";

const rootElement = document.getElementById("root")!;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
          <App />
          <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);


