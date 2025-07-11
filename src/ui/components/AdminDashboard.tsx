import React, { useState, useEffect } from 'react';

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

interface Metrics {
  totalConversations: number;
  activeConversations: number;
  avgResponseTime: number;
  toolUsage: Record<string, number>;
  userSatisfaction: number;
  escalationRate: number;
  timestamp: string;
}

interface AdminDashboardProps {
  apiUrl: string;
  apiKey: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  apiUrl = 'http://localhost:3000/api/admin',
  apiKey = '',
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState({
    tools: false,
    metrics: false,
    config: false,
  });
  const [error, setError] = useState({
    tools: '',
    metrics: '',
    config: '',
  });

  const headers = {
    'Content-Type': 'application/json',
    'X-Admin-API-Key': apiKey,
  };

  // Fetch tools
  const fetchTools = async () => {
    setLoading((prev) => ({ ...prev, tools: true }));
    setError((prev) => ({ ...prev, tools: '' }));
    
    try {
      const response = await fetch(`${apiUrl}/tools`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setTools(data.tools);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setError((prev) => ({
        ...prev,
        tools: error instanceof Error ? error.message : 'Failed to fetch tools',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, tools: false }));
    }
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    setLoading((prev) => ({ ...prev, metrics: true }));
    setError((prev) => ({ ...prev, metrics: '' }));
    
    try {
      const response = await fetch(`${apiUrl}/metrics`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError((prev) => ({
        ...prev,
        metrics: error instanceof Error ? error.message : 'Failed to fetch metrics',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, metrics: false }));
    }
  };

  // Fetch config
  const fetchConfig = async () => {
    setLoading((prev) => ({ ...prev, config: true }));
    setError((prev) => ({ ...prev, config: '' }));
    
    try {
      const response = await fetch(`${apiUrl}/config`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
      setError((prev) => ({
        ...prev,
        config: error instanceof Error ? error.message : 'Failed to fetch config',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, config: false }));
    }
  };

  // Toggle tool enabled/disabled
  const toggleTool = async (name: string, enabled: boolean) => {
    const toolToUpdate = tools.find((t) => t.name === name);
    
    if (!toolToUpdate) return;
    
    try {
      const response = await fetch(`${apiUrl}/tools`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...toolToUpdate,
          enabled,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update local state
      setTools((prevTools) =>
        prevTools.map((t) =>
          t.name === name ? { ...t, enabled } : t
        )
      );
    } catch (error) {
      console.error('Error updating tool:', error);
      // Revert the change in the UI
      setTools((prevTools) => [...prevTools]);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchTools();
    fetchMetrics();
    fetchConfig();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Key Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
          
          {loading.metrics ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            </div>
          ) : error.metrics ? (
            <div className="text-red-500">{error.metrics}</div>
          ) : metrics ? (
            <div className="space-y-4">
              <div>
                <p className="text-gray-500">Total Conversations</p>
                <p className="text-2xl font-bold">{metrics.totalConversations}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Active Conversations</p>
                <p className="text-2xl font-bold">{metrics.activeConversations}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Avg Response Time</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(2)}s</p>
              </div>
              
              <div>
                <p className="text-gray-500">User Satisfaction</p>
                <p className="text-2xl font-bold">{metrics.userSatisfaction.toFixed(1)}/5.0</p>
              </div>
              
              <div>
                <p className="text-gray-500">Escalation Rate</p>
                <p className="text-2xl font-bold">
                  {(metrics.escalationRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ) : (
            <p>No metrics available</p>
          )}
        </div>

        {/* Tool Usage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tool Usage</h2>
          
          {loading.metrics ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            </div>
          ) : error.metrics ? (
            <div className="text-red-500">{error.metrics}</div>
          ) : metrics && metrics.toolUsage ? (
            <div className="space-y-2">
              {Object.entries(metrics.toolUsage).map(([tool, count]) => (
                <div key={tool} className="flex justify-between items-center">
                  <span className="font-medium">{tool}</span>
                  <span className="text-gray-600">{count} calls</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No tool usage data available</p>
          )}
        </div>

        {/* System Config */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">System Configuration</h2>
          
          {loading.config ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            </div>
          ) : error.config ? (
            <div className="text-red-500">{error.config}</div>
          ) : config ? (
            <div className="space-y-2">
              <div>
                <p className="text-gray-500">Environment</p>
                <p className="font-medium">{config.server?.env}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Model</p>
                <p className="font-medium">{config.openai?.model}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Temperature</p>
                <p className="font-medium">{config.openai?.temperature}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Confidence Threshold</p>
                <p className="font-medium">{config.agent?.feedback?.confidenceThreshold}</p>
              </div>
            </div>
          ) : (
            <p>No configuration available</p>
          )}
        </div>
      </div>

      {/* Tools Management */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Tools Management</h2>
        
        {loading.tools ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          </div>
        ) : error.tools ? (
          <div className="text-red-500">{error.tools}</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.name} className="border-t">
                  <td className="py-3">{tool.name}</td>
                  <td className="py-3">{tool.description}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tool.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tool.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      className={`px-3 py-1 rounded text-white text-sm ${
                        tool.enabled
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                      onClick={() => toggleTool(tool.name, !tool.enabled)}
                    >
                      {tool.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
              
              {tools.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    No tools available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Refresh buttons */}
      <div className="flex space-x-4">
        <button
          onClick={fetchTools}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading.tools}
        >
          {loading.tools ? 'Loading...' : 'Refresh Tools'}
        </button>
        
        <button
          onClick={fetchMetrics}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading.metrics}
        >
          {loading.metrics ? 'Loading...' : 'Refresh Metrics'}
        </button>
        
        <button
          onClick={fetchConfig}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading.config}
        >
          {loading.config ? 'Loading...' : 'Refresh Config'}
        </button>
      </div>
    </div>
  );
};