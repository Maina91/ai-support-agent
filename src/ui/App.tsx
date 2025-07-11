import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { AdminPage } from './pages/AdminPage';
import { HumanAgentPage } from './pages/HumanAgentPage';
import './styles.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <header className="bg-blue-600 text-white">
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">AI Support Agent</h1>
              <nav className="space-x-4">
                <Link to="/" className="hover:underline">
                  Chat
                </Link>
                <Link to="/admin" className="hover:underline">
                  Admin
                </Link>
                <Link to="/agent" className="hover:underline">
                  Human Agent
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto p-4">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/agent" element={<HumanAgentPage />} />
          </Routes>
        </main>

        <footer className="bg-gray-100 text-gray-600 text-sm">
          <div className="container mx-auto p-4">
            <p className="text-center">© 2023 AI Support Agent</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};