import { useState, useRef, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";
import { SafetyOverlay } from "./SafetyOverlay";
import { sendFlagAlert } from "../../api/auth";

const contacts = [
  { id: 1, initials: "AK", name: "Alex K.",  last: "Hey are you free later?",  color: "#ddd6fe", text: "#4c1d95" },
  { id: 2, initials: "MJ", name: "Maya J.",  last: "Can we meet at the park?", color: "#bfdbfe", text: "#1e3a5f" },
  { id: 3, initials: "RS", name: "Riley S.", last: "Move to Telegram instead", color: "#fde8d8", text: "#7f1d1d" },
];

type TickStatus = "sent" | "delivered" | "read";
interface Message { sender: string; text: string; time: string; tick?: TickStatus; }

const Ticks = ({ status }: { status?: TickStatus }) => {
  if (!status) return null;
  const color = status === "read" ? "#7c3aed" : "#a78bfa";
  if (status === "sent") return <span style={{ color, fontSize: 13, marginLeft: 4 }}>✓</span>;
  return <span style={{ color, fontSize: 13, marginLeft: 4 }}>✓✓</span>;
};

const TypingDots = () => (
  <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
    {[0,1,2].map(i => (
      <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
    ))}
    <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
  </div>
);

interface ChatProps { onLogout?: () => void; }

export const ChatWindow = ({ onLogout }: ChatProps) => {
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
    if (last.sender === "child") return;
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
    <div style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #dbeafe 100%)", fontFamily: "'Segoe UI', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>

      {/* Main card — matches parent dashboard style */}
      <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(20px)", borderRadius: 40, border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 25px 50px rgba(124,58,237,0.1)", display: "flex", overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        <div style={{ width: 280, flexShrink: 0, background: "linear-gradient(180deg, #9b87f5 0%, #a78bfa 50%, #93c5fd 100%)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Sidebar Header */}
          <div style={{ flexShrink: 0, padding: "20px 20px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "white", letterSpacing: 1, lineHeight: 1 }}>cura</div>
            </div>
            {onLogout && (
              <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, color: "rgba(255,255,255,0.8)", fontSize: 11, cursor: "pointer", padding: "5px 10px", marginTop: 4 }}>
                Log out
              </button>
            )}
          </div>

          {/* Search */}
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 14, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ fontSize: 14 }}></span> Search or start new chat
            </div>
          </div>

          {/* Section label */}
          <div style={{ padding: "0 20px 8px" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: 3, textTransform: "uppercase" }}>Contacts</span>
          </div>

          {/* Contacts */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 12px" }}>
            {contacts.map(c => (
              <div key={c.id} onClick={() => { setActiveContact(c); simulateTyping(c.id); }}
                style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderRadius: 18, marginBottom: 8, background: c.id === activeContact.id ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", transition: "background 0.2s" }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: c.color, color: c.text, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{c.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{c.name}</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: typingContactId === c.id ? "#bde0fe" : "rgba(255,255,255,0.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {typingContactId === c.id ? "typing..." : c.last}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Chat Header */}
          <div style={{ flexShrink: 0, padding: "16px 24px", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: activeContact.color, color: activeContact.text, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{activeContact.initials}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#3b0764" }}>{activeContact.name}</div>
              <div style={{ fontSize: 12, color: otherTyping ? "#7c3aed" : "#a78bfa" }}>{otherTyping ? "typing..." : "● online"}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "20px 40px", display: "flex", flexDirection: "column", gap: 6 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.sender === "child" ? "flex-end" : "flex-start", marginBottom: 2 }}>
                <div style={{
                  maxWidth: "60%", padding: "10px 14px 8px",
                  borderRadius: msg.sender === "child" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.sender === "child" ? "linear-gradient(135deg, #a78bfa, #7c3aed)" : "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(8px)",
                  border: msg.sender === "child" ? "none" : "1px solid rgba(255,255,255,0.5)",
                  color: msg.sender === "child" ? "white" : "#3b0764",
                  fontSize: 14, lineHeight: 1.5,
                  boxShadow: "0 2px 12px rgba(124,58,237,0.1)"
                }}>
                  {msg.text}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: msg.sender === "child" ? "rgba(255,255,255,0.65)" : "#a78bfa" }}>{msg.time}</span>
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
            <div style={{ flexShrink: 0, margin: "0 20px 10px", background: "rgba(254,243,199,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ color: "#92400e", fontSize: 12, fontWeight: 600, flex: 1 }}>
                {safetyFlag === "unsafe_content" && "Is this unsafe? Talk to a trusted adult. Helpline: 1098"}
                {safetyFlag === "pii_share" && "You're about to share personal info — are you sure?"}
                {safetyFlag === "platform_switch" && "This person is asking you to move platforms — red flag!"}
              </span>
              <button onClick={clearFlag} style={{ padding: "5px 12px", background: "rgba(255,255,255,0.7)", color: "#78350f", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10, fontSize: 11, cursor: "pointer", marginRight: 6 }}>I'm okay</button>
              <button onClick={handleBlock} style={{ padding: "5px 12px", background: "#dc2626", color: "white", border: "none", borderRadius: 10, fontSize: 11, cursor: "pointer" }}>Block user</button>
            </div>
          )}

          {/* Test buttons */}
          <div style={{ flexShrink: 0, padding: "6px 20px", background: "rgba(255,255,255,0.3)", borderTop: "1px solid rgba(255,255,255,0.3)", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "#a78bfa", fontSize: 11 }}>Test flags →</span>
            <button onClick={() => setSafetyFlag("unsafe_content")} style={{ padding: "3px 10px", background: "rgba(254,226,226,0.8)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>🔴 Unsafe</button>
            <button onClick={() => setSafetyFlag("pii_share")} style={{ padding: "3px 10px", background: "rgba(255,237,213,0.8)", color: "#ea580c", border: "1px solid rgba(234,88,12,0.2)", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>🟠 PII</button>
            <button onClick={() => setSafetyFlag("platform_switch")} style={{ padding: "3px 10px", background: "rgba(243,232,255,0.8)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>🟣 Platform</button>
          </div>

          {/* Input */}
          <div style={{ flexShrink: 0, padding: "12px 20px", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.4)", display: "flex", gap: 10, alignItems: "center" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Type a message"
              style={{ flex: 1, background: "rgba(255,255,255,0.7)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 24, padding: "11px 20px", color: "#3b0764", fontSize: 14, outline: "none" }}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "rgba(167,139,250,0.3)"} />
            <button onClick={handleSend} style={{ width: 44, height: 44, background: "linear-gradient(135deg, #a78bfa, #7c3aed)", border: "none", borderRadius: "50%", color: "white", cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>➤</button>
          </div>
        </div>

        <SafetyOverlay flag={safetyFlag} onDismiss={clearFlag} onBlock={handleBlock} />
      </div>
    </div>
  );
};