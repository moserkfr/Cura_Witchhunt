// frontend/src/hooks/useSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export type SafetyFlag = "unsafe_content" | "pii_share" | "platform_switch" | null;

export function useSocket(serverUrl: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [safetyFlag, setSafetyFlag] = useState<SafetyFlag>(null);

  useEffect(() => {
    socketRef.current = io(serverUrl);

    // Receive message
    socketRef.current.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Receive safety flag from backend
    socketRef.current.on("safety_flag", (flag: SafetyFlag) => {
      setSafetyFlag(flag);
    });

    return () => { socketRef.current?.disconnect(); };
  }, [serverUrl]);

  const sendMessage = (text: string) => {
    socketRef.current?.emit("message", { sender: "child", text });
    setMessages((prev) => [...prev, { sender: "child", text }]);
  };

  const clearFlag = () => setSafetyFlag(null);

  return { messages, sendMessage, safetyFlag, setSafetyFlag, clearFlag };
}