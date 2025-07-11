import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatHistoryItem {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'human-agent';
  timestamp: Date;
}

interface HandoffRequest {
  id: string;
  sessionId: string;
  userId: string;
  reason: string;
  priority: number;
  timestamp: Date;
  status: 'pending' | 'assigned' | 'completed';
  estimatedWaitTime: number;
  conversationHistory?: ChatHistoryItem[];
}

interface AgentPanelProps {
  apiEndpoint?: string;
  apiKey: string;
}

export const HumanAgentPanel: React.FC<AgentPanelProps> = ({
  apiEndpoint = 'http://localhost:3000/api',
  apiKey,
}) => {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([]);
  const [activeHandoff, setActiveHandoff] = useState<HandoffRequest | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatHistoryItem[]>([]);
  const [responseInput, setResponseInput] = useState('');
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('offline');
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);

  // Register agent when name is set
  const handleRegister = async () => {
    if (!agentName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiEndpoint}/human-agent/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-API-Key': apiKey,
        },
        body: JSON.stringify({
          name: agentName,
          status: 'available',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register agent');
      }

      const data = await response.json();
      setAgentId(data.agent.id);
      setStatus('available');
      setError(null);
      
      // Start polling for handoff requests
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Start polling for handoff requests
  const startPolling = () => {
    if (refreshInterval) clearInterval(refreshInterval);
    
    const interval = setInterval(() => {
      fetchHandoffRequests();
    }, 5000); // Poll every 5 seconds
    
    setRefreshInterval(interval);
  };

  // Fetch handoff requests
  const fetchHandoffRequests = async () => {
    if (!agentId) return;

    try {
      const response = await fetch(`${apiEndpoint}/human-agent/queue`, {
        headers: {
          'X-Admin-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch handoff requests');
      }

      const data = await response.json();
      setHandoffRequests(data.requests);
    } catch (err) {
      console.error('Error fetching handoff requests:', err);
    }
  };

  // Accept a handoff request
  const handleAcceptHandoff = async (handoffId: string) => {
    if (!agentId) return;

    try {
      setLoading(true);
      const response = await fetch(`${apiEndpoint}/human-agent/handoff/${handoffId}/accept`, {
        method: 'POST',
        headers: {
          'X-Admin-API-Key': apiKey,
          'X-Agent-Id': agentId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to accept handoff');
      }

      const data = await response.json();
      setActiveHandoff(data.handoff);
      setStatus('busy');
      
      // Fetch full handoff details including conversation history
      await fetchHandoffDetails(handoffId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch full details for a handoff
  const fetchHandoffDetails = async (handoffId: string) => {
    try {
      const response = await fetch(`${apiEndpoint}/human-agent/handoff/${handoffId}`, {
        headers: {
          'X-Admin-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch handoff details');
      }

      const data = await response.json();
      setActiveHandoff(data);
      
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }
    } catch (err) {
      console.error('Error fetching handoff details:', err);
    }
  };

  // Complete a handoff
  const handleCompleteHandoff = async () => {
    if (!activeHandoff) return;

    try {
      setLoading(true);
      const response = await fetch(`${apiEndpoint}/human-agent/handoff/${activeHandoff.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-API-Key': apiKey,
        },
        body: JSON.stringify({
          resolution: 'Resolved by human agent',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete handoff');
      }

      // Reset active handoff
      setActiveHandoff(null);
      setConversationHistory([]);
      setResponseInput('');
      setStatus('available');
      
      // Update agent status
      await updateAgentStatus('available');
      
      // Refresh handoff queue
      fetchHandoffRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update agent status
  const updateAgentStatus = async (newStatus: 'available' | 'busy' | 'offline') => {
    if (!agentId) return;

    try {
      const response = await fetch(`${apiEndpoint}/human-agent/agent/${agentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-API-Key': apiKey,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setStatus(newStatus);
      
      // If going offline, clear handoff data
      if (newStatus === 'offline') {
        if (activeHandoff) {
          // If there's an active handoff, complete it first
          await handleCompleteHandoff();
        }
        
        setAgentId(null);
        clearInterval(refreshInterval!);
        setRefreshInterval(null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Send a response to the user
  const handleSendResponse = () => {
    if (!responseInput.trim() || !activeHandoff) return;
    
    // In a real application, this would send the message to the user
    // For this demo, we'll just add it to the conversation history
    setConversationHistory((prev) => [
      ...prev,
      {
        id: `agent-${Date.now()}`,
        content: responseInput,
        role: 'human-agent',
        timestamp: new Date(),
      },
    ]);
    
    setResponseInput('');
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [refreshInterval]);

  // Render the agent registration form
  if (!agentId) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Human Agent Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="agentName" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            id="agentName"
            className="mt-1 p-2 w-full border rounded-md"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Registering...' : 'Register as Agent'}
        </button>
      </div>
    );
  }

  // Render the active handoff view
  if (activeHandoff) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Active Support Session</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {status}
            </span>
            <button
              onClick={handleCompleteHandoff}
              disabled={loading}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 text-sm"
            >
              Complete Session
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium text-gray-700">Handoff Reason:</h3>
          <p className="p-2 bg-orange-50 rounded-md">{activeHandoff.reason}</p>
        </div>
        
        <div className="border rounded-md h-96 overflow-y-auto mb-4 p-4 bg-gray-50">
          {conversationHistory.length === 0 ? (
            <p className="text-gray-500 italic">No conversation history available</p>
          ) : (
            conversationHistory.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 p-3 rounded-md ${
                  msg.role === 'user'
                    ? 'bg-blue-100 ml-auto max-w-[80%]'
                    : msg.role === 'human-agent'
                    ? 'bg-green-100 mr-auto max-w-[80%]'
                    : msg.role === 'system'
                    ? 'bg-yellow-100 mx-auto text-center italic max-w-[80%]'
                    : 'bg-gray-100 mr-auto max-w-[80%]'
                }`}
              >
                <div className="prose">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-2">
          <textarea
            value={responseInput}
            onChange={(e) => setResponseInput(e.target.value)}
            className="flex-1 p-2 border rounded-md"
            placeholder="Type your response..."
            rows={3}
          ></textarea>
          <button
            onClick={handleSendResponse}
            disabled={!responseInput.trim()}
            className="px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 self-end"
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  // Render the handoff queue
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Support Queue</h2>
        <div className="flex items-center gap-4">
          <span>
            Agent: <strong>{agentName}</strong>
          </span>
          <div className="relative inline-block">
            <select
              value={status}
              onChange={(e) => updateAgentStatus(e.target.value as any)}
              className="pl-3 pr-8 py-1 border rounded-md appearance-none bg-white"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {handoffRequests.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No support requests in queue</p>
          <p className="text-sm text-gray-400 mt-2">Refreshes automatically every 5 seconds</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wait Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {handoffRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.priority >= 4
                          ? 'bg-red-100 text-red-800'
                          : request.priority === 3
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.estimatedWaitTime} min
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleAcceptHandoff(request.id)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-900 disabled:text-blue-300"
                    >
                      Accept
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <button
          onClick={fetchHandoffRequests}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          Refresh Queue
        </button>
      </div>
    </div>
  );
};