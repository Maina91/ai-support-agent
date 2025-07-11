import React, { useState } from 'react';
import { HumanAgentPanel } from '../components/HumanAgentPanel';
import { Layout } from '../components/Layout';

export const HumanAgentPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, validate the API key against a server
    // For demo purposes, we'll use a simple check
    if (apiKey.trim() !== '') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Please enter an API key');
    }
  };

  return (
    <Layout title="Human Agent Dashboard">
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Agent Authentication</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleAuthenticate}>
            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                Admin API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 p-2 w-full border rounded-md"
                placeholder="Enter admin API key"
              />
              <p className="mt-1 text-xs text-gray-500">
                (For demo: enter any value)
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
              Login
            </button>
          </form>
        </div>
      ) : (
        <HumanAgentPanel apiKey={apiKey} />
      )}
    </Layout>
  );
};