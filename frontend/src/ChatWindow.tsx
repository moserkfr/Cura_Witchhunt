import { useState, useRef, useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import { SafetyOverlay } from "./SafetyOverlay";
import { sendFlagAlert } from "./api/auth";

const contacts = [
  { id: 1, initials: "AK", name: "Alex K.",  last: "Hey are you free later?",   color: "#1e3a5f", text: "#60a5fa" },
  { id: 2, initials: "MJ", name: "Maya J.",  last: "Can we meet at the park?",   color: "#1a2e1a", text: "#4ade80" },
  { id: 3, initials: "RS", name: "Riley S.", last: "Move to Telegram instead",   color: "#3b1f1f", text: "#f87171" }
];

type TickStatus = "sent" | "delivered" | "read";
interface Message { sender: string; text: string; time: string; tick?: TickStatus; }

const Ticks = ({ status }: { status?: TickStatus }) => {
  if (!status) return null;
  const color = status === "read" ? "#53bdeb" : "#8696a0";
  if (status === "sent") return <span style={{ color, fontSize: 13, marginLeft: 4 }}>✓</span>;
  return <span style={{ color, fontSize: 13, marginLeft: 4 }}>✓✓</span>;
};

const TypingDots = () => (
  <div style={{ alignSelf: "flex-start", background: "#202c33", borderRadius: "12px 12px 12px 3px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
    {[0,1,2].map(i => (
      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#8696a0", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
    ))}
    <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
  </div>
);

export const ChatWindow = () => {
  const { messages: socketMessages, sendMessage, safetyFlag, setSafetyFlag, clearFlag } = useSocket("http://localhost:3001");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeContact, setActiveContact] = useState(contacts[0]);
  const [typingContactId, setTypingContactId] = useState<number | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socketMessages.length === 0) return;
    const last = socketMessages[socketMessages.length - 1];
    if (last.sender === "child") return; // already added in handleSend
    setMessages(prev => [...prev, { sender: last.sender, text: last.text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
}, [socketMessages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.sender !== "child" || last.tick === "read") return;
    const t1 = setTimeout(() => setMessages(prev => prev.map((m,i) => i===prev.length-1 ? {...m,tick:"delivered"} : m)), 1000);
    const t2 = setTimeout(() => setMessages(prev => prev.map((m,i) => i===prev.length-1 ? {...m,tick:"read"} : m)), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { sender: "child", text: input.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), tick: "sent" }]);
    sendMessage(input.trim());
    setInput("");
    setOtherTyping(true);
    setTimeout(() => {
      setOtherTyping(false);
      setMessages(prev => [...prev, { sender: "other", text: "Ok sure, let me check!", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }, 2200);
  };

  const simulateTyping = (id: number) => {
    setTypingContactId(id);
    setTimeout(() => setTypingContactId(null), 3000);
  };

  const handleBlock = () => {
    sendFlagAlert(safetyFlag || "unknown", "User blocked by child");
    alert("User blocked and reported to parent.");
    clearFlag();
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", background: "#111b21", fontFamily: "'Segoe UI', sans-serif", color: "#e9edef" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 360, flexShrink: 0, background: "#111b21", borderRight: "1px solid #222d34", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Sidebar Header */}
        <div style={{ flexShrink: 0, padding: "14px 20px", background: "#202c33", display: "flex", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, color: "#00a884", letterSpacing: 1 }}>CURA</div>
            <div style={{ color: "#8696a0", fontSize: 13, marginTop: 2 }}>The Guard that never sleeps</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ flexShrink: 0, padding: "8px 12px", background: "#111b21" }}>
          <div style={{ background: "#202c33", borderRadius: 8, padding: "8px 14px", color: "#8696a0", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            Search or start new chat
          </div>
        </div>

        {/* Contacts — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {contacts.map(c => (
            <div key={c.id} onClick={() => { setActiveContact(c); simulateTyping(c.id); }}
              style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid #222d34", background: c.id === activeContact.id ? "#2a3942" : "transparent" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: c.color, color: c.text, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>{c.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#e9edef", textAlign: "left" }}>{c.name}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: typingContactId === c.id ? "#00a884" : "#8696a0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
                  {typingContactId === c.id ? "typing..." : c.last}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0b141a", overflow: "hidden", minWidth: 0 }}>

        {/* Chat Header */}
        <div style={{ flexShrink: 0, padding: "10px 20px", background: "#202c33", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #222d34" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: activeContact.color, color: activeContact.text, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>{activeContact.initials}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#e9edef" }}>{activeContact.name}</div>
            <div style={{ fontSize: 12, color: otherTyping ? "#00a884" : "#8696a0" }}>{otherTyping ? "typing..." : "● online"}</div>
          </div>
        </div>

        {/* Messages — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 60px", display: "flex", flexDirection: "column", gap: 4 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.sender === "child" ? "flex-end" : "flex-start", marginBottom: 2 }}>
              <div style={{ maxWidth: "65%", padding: "7px 12px 6px", borderRadius: msg.sender === "child" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", background: msg.sender === "child" ? "#005c4b" : "#202c33", color: "#e9edef", fontSize: 14, lineHeight: 1.5 }}>
                {msg.text}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: "#8696a0" }}>{msg.time}</span>
                  {msg.sender === "child" && <Ticks status={msg.tick} />}
                </div>
              </div>
            </div>
          ))}
          {otherTyping && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* Safety flag banner */}
        {safetyFlag && (
          <div style={{ flexShrink: 0, margin: "0 16px 8px", background: "#1a1200", border: "0.5px solid #854d0e", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#f59e0b", fontSize: 18 }}>⚠</span>
            <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 500, flex: 1 }}>
              {safetyFlag === "unsafe_content" && "Is this unsafe? Talk to a trusted adult. Helpline: 9152987821"}
              {safetyFlag === "pii_share" && "You're about to share personal info — are you sure?"}
              {safetyFlag === "platform_switch" && "This person is asking you to move platforms — red flag!"}
            </span>
            <button onClick={clearFlag} style={{ padding: "4px 10px", background: "#292524", color: "#a8a29e", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", marginRight: 6 }}>I'm okay</button>
            <button onClick={handleBlock} style={{ padding: "4px 10px", background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Block user</button>
          </div>
        )}

        {/* Test buttons — REMOVE BEFORE DEMO */}
        <div style={{ flexShrink: 0, padding: "6px 16px", background: "#0b141a", borderTop: "1px solid #222d34", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ color: "#8696a0", fontSize: 11 }}>Test flags →</span>
          <button onClick={() => setSafetyFlag("unsafe_content")} style={{ padding: "3px 10px", background: "#1e1010", color: "#f87171", border: "0.5px solid #7f1d1d", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>🔴 Unsafe</button>
          <button onClick={() => setSafetyFlag("pii_share")} style={{ padding: "3px 10px", background: "#1c1400", color: "#fb923c", border: "0.5px solid #78350f", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>🟠 PII</button>
          <button onClick={() => setSafetyFlag("platform_switch")} style={{ padding: "3px 10px", background: "#140e1e", color: "#c084fc", border: "0.5px solid #581c87", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>🟣 Platform</button>
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, padding: "10px 16px", background: "#202c33", display: "flex", gap: 10, alignItems: "center" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type a message"
            style={{ flex: 1, background: "#2a3942", border: "none", borderRadius: 22, padding: "10px 18px", color: "#e9edef", fontSize: 14, outline: "none" }} />
          <button onClick={handleSend} style={{ width: 42, height: 42, background: "#00a884", border: "none", borderRadius: "50%", color: "#111b21", cursor: "pointer", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>➤</button>
        </div>
      </div>

      <SafetyOverlay flag={safetyFlag} onDismiss={clearFlag} onBlock={handleBlock} />
    </div>
  );
};