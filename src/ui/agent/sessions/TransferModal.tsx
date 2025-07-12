import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { UserPlus2, Send } from "lucide-react";
import { Textarea } from "../../components/ui/textarea";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";

interface Agent {
  id: string;
  name: string;
  status: "online" | "offline";
}

interface TransferModalProps {
  availableAgents: Agent[];
  onTransfer: (agentId: string, note?: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  availableAgents,
  onTransfer,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const handleTransfer = () => {
    if (selectedAgent) {
      onTransfer(selectedAgent.id, note);
      setOpen(false);
      setNote("");
      setSelectedAgent(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus2 className="w-4 h-4" />
          Transfer Chat
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Select an agent to transfer</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a team member and optionally provide context for the
            transfer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="h-48 w-full border rounded-md p-2 space-y-2">
          {availableAgents.length === 0 && (
            <div className="text-sm text-muted-foreground italic text-center">
              No available agents
            </div>
          )}

          {availableAgents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`cursor-pointer p-2 rounded-md border ${
                selectedAgent?.id === agent.id
                  ? "bg-blue-100 border-blue-500"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{agent.name}</span>
                <Badge
                  variant={agent.status === "online" ? "default" : "outline"}
                  className={`${
                    agent.status === "online"
                      ? "bg-green-500 text-white"
                      : "text-muted-foreground border"
                  } text-xs`}
                >
                  {agent.status}
                </Badge>
              </div>
            </div>
          ))}
        </ScrollArea>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for the receiving agent..."
          className="mt-4"
        />

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleTransfer} disabled={!selectedAgent}>
            <Send className="w-4 h-4 mr-2" />
            Confirm Transfer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
