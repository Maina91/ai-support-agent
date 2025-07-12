import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { Bot } from "lucide-react";
import { Textarea } from "../../components/ui/textarea";

interface ReturnToAIModalProps {
  onConfirm: (reason?: string) => void;
}

export const ReturnToAIModal: React.FC<ReturnToAIModalProps> = ({
  onConfirm,
}) => {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setOpen(false);
    setReason("");
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bot className="w-4 h-4" />
          Return to AI
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Return conversation to AI?</AlertDialogTitle>
          <AlertDialogDescription>
            The AI assistant will resume this conversation. You can optionally
            leave a note or reason for the handoff.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Textarea
          placeholder="Optional: Add a reason or handoff note..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2"
        />

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
