import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export function useChatSession() {
  const [sessionId] = useState(uuidv4());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  return { sessionId, isOnline };
}
