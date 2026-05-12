// frontend/src/SafetyOverlay.tsx
import React from "react";
import type { SafetyFlag } from "./hooks/useSocket";

interface Props {
  flag: SafetyFlag;
  onDismiss: () => void;
  onBlock: () => void;
}

const HELPLINE = "1098"; // replace with real number

const flagContent: Record<NonNullable<SafetyFlag>, { title: string; tip: string; color: string }> = {
  unsafe_content: {
    title: "⚠️ Is this unsafe?",
    tip: "This message may be harmful. You don't have to reply. Talk to a trusted adult.",
    color: "#FF4444",
  },
  pii_share: {
    title: "🔒 You're about to share personal info",
    tip: "Are you sure? Never share your real name, address, phone, or school online.",
    color: "#FF8800",
  },
  platform_switch: {
    title: "🚨 Platform Switch Warning",
    tip: "This person is asking you to move to another app. This is a red flag!",
    color: "#CC00FF",
  },
};

export const SafetyOverlay: React.FC<Props> = ({ flag, onDismiss, onBlock }) => {
  if (!flag) return null;
  const content = flagContent[flag];

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#1a1a2e", border: `2px solid ${content.color}`,
        borderRadius: 16, padding: 32, maxWidth: 400, textAlign: "center",
        color: "white", fontFamily: "sans-serif"
      }}>
        <h2 style={{ color: content.color }}>{content.title}</h2>
        <p style={{ fontSize: 16, marginBottom: 16 }}>{content.tip}</p>
        <p style={{ fontSize: 14, color: "#aaa" }}>
          Need help? Call helpline: <strong style={{ color: "#00ffcc" }}>{HELPLINE}</strong>
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
          <button onClick={onDismiss}
            style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
            I'm okay
          </button>
          <button onClick={onBlock}
            style={{ padding: "10px 20px", background: content.color, color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Block User
          </button>
        </div>
      </div>
    </div>
  );
};