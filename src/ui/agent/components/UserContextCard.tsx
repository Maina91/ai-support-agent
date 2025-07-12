import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { UserIcon, MailIcon, ClockIcon, ShieldAlertIcon } from "lucide-react";

interface UserContext {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatarUrl?: string;
  lastSeen: string;
  joinedAt: string;
  isBlocked?: boolean;
}

interface UserContextCardProps {
  user: UserContext;
  onBlock?: () => void;
  onEscalate?: () => void;
}

export const UserContextCard: React.FC<UserContextCardProps> = ({
  user,
  onBlock,
  onEscalate,
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-base">{user.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          <span>{user.role}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClockIcon className="h-4 w-4" />
          <span>Last seen: {user.lastSeen}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlertIcon className="h-4 w-4" />
          <span>Joined: {user.joinedAt}</span>
        </div>

        {user.isBlocked && (
          <Badge variant="destructive" className="mt-2">
            Blocked
          </Badge>
        )}

        <div className="pt-4 flex gap-2">
          <Button variant="destructive" size="sm" onClick={onBlock}>
            {user.isBlocked ? "Unblock" : "Block"}
          </Button>
          <Button variant="outline" size="sm" onClick={onEscalate}>
            Escalate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
