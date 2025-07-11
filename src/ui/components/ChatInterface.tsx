import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'human-agent';
  timestamp: Date;
  isLoading?: boolean;
  toolCalls?: {
    tool: string;
    input: Record<string, any>;
  }[];
  needsHumanIntervention?: boolean;
  handoffReason?: string;
  estimatedWaitTime?: number;
  agentName?: string;
}

interface ChatInterfaceProps {
  userId: string;
  apiEndpoint?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  apiEndpoint = 'http://localhost:3000/api/agent/chat',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Hello! How can I assist you today?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(uuidv4());
  const [isHumanHandoffActive, setIsHumanHandoffActive] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  const [connectedAgentName, setConnectedAgentName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for human agent connection if waiting for handoff
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (waitingForAgent && !connectedAgentName) {
      pollInterval = setInterval(() => {
        // In a real implementation, this would check if an agent has connected
        // For demo purposes, we'll simulate an agent connecting after 10 seconds
        setTimeout(() => {
          if (Math.random() > 0.5) {
            const randomAgentNames = ['Sarah', 'Michael', 'Jessica', 'David', 'Emily'];
            const agentName = randomAgentNames[Math.floor(Math.random() * randomAgentNames.length)];
            setConnectedAgentName(agentName);
            
            // Add agent connected message
            setMessages((prev) => [
              ...prev,
              {
                id: uuidv4(),
                content: `Human agent ${agentName} has joined the conversation.`,
                role: 'system',
                timestamp: new Date(),
              },
            ]);
            
            setWaitingForAgent(false);
          }
        }, 10000);
      }, 5000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [waitingForAgent, connectedAgentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessageId = uuidv4();
    const userMessage: Message = {
      id: userMessageId,
      content: input,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Add placeholder for assistant response
    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: isHumanHandoffActive ? 'human-agent' : 'assistant',
      timestamp: new Date(),
      isLoading: true,
      agentName: isHumanHandoffActive ? connectedAgentName || undefined : undefined,
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(true);
    
    try {
      // If human agent is active, we'd handle differently in a real implementation
      // For demo purposes, we'll simulate a response from the human agent
      if (isHumanHandoffActive) {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `Thank you for your message. I'm ${connectedAgentName}, your human support agent. I'm reviewing your issue now and will help you resolve it.`,
                    isLoading: false,
                  }
                : msg
            )
          );
          setIsLoading(false);
        }, 2000);
        return;
      }
      
      // Stream mode for AI agent
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId,
          userId,
          stream: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      let accumulatedContent = '';
      let needsHumanIntervention = false;
      let handoffReason: string | undefined;
      let estimatedWaitTime: number | undefined;
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          // Convert the chunk to text
          const chunk = new TextDecoder().decode(value);
          
          // Parse the SSE data
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5));
                
                if (data.token) {
                  // Update the message content
                  accumulatedContent += data.token;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent, isLoading: false }
                        : msg
                    )
                  );
                }
                
                if (data.toolCall) {
                  // Add tool call information
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            toolCalls: [...(msg.toolCalls || []), data.toolCall],
                          }
                        : msg
                    )
                  );
                }
                
                if (data.completion) {
                  // Final completion data
                  needsHumanIntervention = data.completion.needsHumanIntervention;
                  handoffReason = data.completion.handoffReason;
                  estimatedWaitTime = data.completion.estimatedWaitTime;
                  
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content: data.completion.message,
                            isLoading: false,
                            toolCalls: data.completion.toolCalls,
                            needsHumanIntervention,
                            handoffReason,
                            estimatedWaitTime,
                          }
                        : msg
                    )
                  );
                  
                  // Handle human intervention if needed
                  if (needsHumanIntervention) {
                    setIsHumanHandoffActive(true);
                    setWaitingForAgent(true);
                  }
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, there was an error processing your request. Please try again.',
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render a single message
  const renderMessage = (message: Message) => {
    // Determine message style based on role
    let messageStyle = 'bg-gray-100 mr-auto';
    let headerContent = null;
    
    if (message.role === 'user') {
      messageStyle = 'bg-blue-100 ml-auto';
    } else if (message.role === 'system') {
      messageStyle = 'bg-yellow-100 mx-auto text-center italic';
    } else if (message.role === 'human-agent') {
      messageStyle = 'bg-green-100 mr-auto';
      headerContent = (
        <div className="text-sm font-medium text-green-800 mb-1">
          {message.agentName || 'Support Agent'}
        </div>
      );
    } else if (message.needsHumanIntervention) {
      messageStyle = 'bg-orange-100 mr-auto';
    }
    
    return (
      <div
        key={message.id}
        className={`p-4 rounded-lg max-w-[80%] ${messageStyle} mb-4`}
      >
        {headerContent}
        
        {message.isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-pulse flex space-x-1">
              <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
            </div>
            <span className="text-sm text-gray-500">Thinking...</span>
          </div>
        ) : (
          <div className="prose">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="font-medium">Tools used:</div>
            {message.toolCalls.map((tc, idx) => (
              <div key={idx} className="mt-1">
                <span className="font-medium">{tc.tool}</span>
                <code className="block bg-gray-800 text-gray-100 p-1 rounded text-xs mt-1 overflow-x-auto">
                  {JSON.stringify(tc.input, null, 2)}
                </code>
              </div>
            ))}
          </div>
        )}
        
        {message.needsHumanIntervention && message.handoffReason && (
          <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
            <div className="font-medium">Reason for human handoff: {message.handoffReason}</div>
            {message.estimatedWaitTime && (
              <div>Estimated wait time: {message.estimatedWaitTime} minutes</div>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-r font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          
          {isHumanHandoffActive && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
              {waitingForAgent ? (
                <span>Waiting for a human agent to connect...</span>
              ) : (
                <span>
                  You are now chatting with{' '}
                  <strong>{connectedAgentName || 'a human agent'}</strong>
                </span>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};