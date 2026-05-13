// frontend/src/hooks/useSocket.ts
import { useEffect, useRef, useState } from "react";

export type SafetyFlag = "unsafe_content" | "pii_share" | "platform_switch" | null;

export function useSocket(username: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [safetyFlag, setSafetyFlag] = useState<SafetyFlag>(null);

  useEffect(() => {
    // Convert http://localhost:3001 → ws://localhost:8000/ws/child
    const user = JSON.parse(localStorage.getItem("cura_user") || "{}");
    const username = user.username || "guest";
    const ws = new WebSocket(`ws://localhost:8000/ws/${username}`);

    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Risk result from your backend { risk_score, risk_level, reason }
        if (data.risk_level === "HIGH") {
          setSafetyFlag("unsafe_content");
        } else if (data.risk_score !== undefined) {
          // it's a risk result, not a chat message — ignore for messages
          return;
        } else {
          // actual chat message from other side
          setMessages((prev) => [...prev, { sender: data.sender, text: data.text }]);
        }
      } catch {
        // plain text message
        setMessages((prev) => [...prev, { sender: "other", text: event.data }]);
      }
    };

    return () => { ws.close(); };
  }, []);

  const sendMessage = (text: string) => {
    wsRef.current?.send(text);
    setMessages((prev) => [...prev, { sender: "child", text }]);
  };

  const clearFlag = () => setSafetyFlag(null);

  return { messages, sendMessage, safetyFlag, setSafetyFlag, clearFlag };
}