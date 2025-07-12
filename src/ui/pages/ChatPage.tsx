// src/pages/ChatPage.tsx
import { ChatInterface } from "../chat/ChatInterface";
import { Card } from "../components/ui/card";

export default function ChatPage() {
  return (
    <main className="h-screen w-full bg-muted text-muted-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-full flex flex-col">
        <ChatInterface />
      </Card>
    </main>
  );
}
