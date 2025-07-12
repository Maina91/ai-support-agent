import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";

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
    <div className="flex gap-2 items-end">

      <Textarea
        className="flex-1 resize-none min-h-[48px]"
        value={input}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message here..."
        disabled={isLoading}
      />

      <Button type="submit" disabled={isLoading} className="h-12">
        {isLoading ? "Sending..." : "Send"}
      </Button>

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
