import React from "react";
import { Button } from "../../components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../components/ui/tooltip";
import { RefreshCw, Filter, UserPlus, Settings } from "lucide-react";

interface ToolbarActionsProps {
  onRefresh?: () => void;
  onAssignAgent?: () => void;
  onOpenFilter?: () => void;
  onSettings?: () => void;
}

export const ToolbarActions: React.FC<ToolbarActionsProps> = ({
  onRefresh,
  onAssignAgent,
  onOpenFilter,
  onSettings,
}) => {
  return (
    <div className="flex gap-2 items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Refresh</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onOpenFilter}>
            <Filter className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Filter</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onAssignAgent}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Assign Agent</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
    </div>
  );
};
