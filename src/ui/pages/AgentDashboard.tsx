// src/pages/ChatPage.tsx
import { Card } from "../components/ui/card";
import { AgentDashboard } from "../agent/dashboard";

export default function AgentDashboardPage() {
  return (
    <main className="h-screen w-full bg-muted text-muted-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-full flex flex-col">
        <AgentDashboard />
      </Card>
    </main>
  );
}
