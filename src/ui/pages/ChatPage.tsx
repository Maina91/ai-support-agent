import React from 'react';
import { Layout } from '../components/Layout.js';
import { ChatInterface } from '../components/ChatInterface.js';

interface ChatPageProps {
  userId?: string;
  apiEndpoint?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  userId = 'user-1',
  apiEndpoint,
}) => {
  return (
    <Layout title="AI Support Agent">
      <div className="h-full">
        <ChatInterface userId={userId} apiEndpoint={apiEndpoint} />
      </div>
    </Layout>
  );
};