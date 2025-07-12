interface Props {
  input: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isHumanHandoffActive: boolean;
  agentName?: string | null;
  waitingForAgent: boolean;
}

export const ChatInputBox: React.FC<Props> = ({
  input,
  onChange,
  onSubmit,
  isLoading,
  isHumanHandoffActive,
  agentName,
  waitingForAgent,
}) => (
  <form onSubmit={onSubmit} className="max-w-3xl mx-auto border-t p-4">
    <div className="flex">
      <input
        className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={input}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-r disabled:bg-blue-300"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send"}
      </button>
    </div>
    {isHumanHandoffActive && (
      <div className="mt-2 p-2 text-sm bg-green-50 border border-green-200 rounded">
        {waitingForAgent
          ? "Waiting for a human agent to connect..."
          : `You are now chatting with ${agentName || "a human agent"}`}
      </div>
    )}
  </form>
);
