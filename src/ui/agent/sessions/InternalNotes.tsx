import React, { useState } from "react";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible";
import { Badge } from "../../components/ui/badge";
import { PencilLine, Save } from "lucide-react";

interface InternalNotesProps {
  defaultNote?: string;
  onSave?: (note: string) => void;
}

export const InternalNotes: React.FC<InternalNotesProps> = ({
  defaultNote = "",
  onSave,
}) => {
  const [note, setNote] = useState(defaultNote);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave?.(note);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between mb-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-muted-foreground"
          >
            <PencilLine className="w-4 h-4" />
            Internal Notes
          </Button>
        </CollapsibleTrigger>

        {note && (
          <Badge variant="secondary" className="text-xs">
            Notes Saved
          </Badge>
        )}
      </div>

      <CollapsibleContent>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write internal notes here. These are visible to agents only."
          className="min-h-[120px] text-sm"
        />

        <div className="mt-2 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Note"}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
