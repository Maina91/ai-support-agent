import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '../../../src/ui/components/ChatInterface';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementation
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        messageId: 'test-message-id', 
        response: 'This is a test response from the AI agent.'
      }),
    });
  });

  it('renders the chat interface', () => {
    render(<ChatInterface />);
    
    expect(screen.getByPlaceholderText(/Type your message here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('allows users to type a message', async () => {
    render(<ChatInterface />);
    
    const inputField = screen.getByPlaceholderText(/Type your message here/i);
    await userEvent.type(inputField, 'Hello, agent!');
    
    expect(inputField).toHaveValue('Hello, agent!');
  });

  it('sends messages when the send button is clicked', async () => {
    render(<ChatInterface />);
    
    const inputField = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await userEvent.type(inputField, 'Hello, agent!');
    await userEvent.click(sendButton);
    
    // Check that fetch was called with the right parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/agent/message'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('Hello, agent!'),
      })
    );
  });

  it('displays messages in the chat history', async () => {
    render(<ChatInterface />);
    
    const inputField = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await userEvent.type(inputField, 'Hello, agent!');
    await userEvent.click(sendButton);
    
    // Wait for the user message to appear
    await waitFor(() => {
      expect(screen.getByText('Hello, agent!')).toBeInTheDocument();
    });
    
    // Wait for the agent response to appear
    await waitFor(() => {
      expect(screen.getByText('This is a test response from the AI agent.')).toBeInTheDocument();
    });
  });

  it('shows a loading state while waiting for a response', async () => {
    // Mock a delayed response
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ 
            messageId: 'test-message-id', 
            response: 'This is a delayed response.'
          }),
        }), 1000)
      )
    );
    
    render(<ChatInterface />);
    
    const inputField = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await userEvent.type(inputField, 'Hello, agent!');
    await userEvent.click(sendButton);
    
    // Check for loading indicator
    expect(await screen.findByText(/loading/i, {}, { timeout: 500 })).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock an error response
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    render(<ChatInterface />);
    
    const inputField = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    await userEvent.type(inputField, 'Hello, agent!');
    await userEvent.click(sendButton);
    
    // Should display an error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});