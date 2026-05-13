interface Props {
  onChildSignup: () => void;
  onParentSignup: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onChildSignup, onParentSignup, onLogin }: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg, #bde0fe 0%, #ba9fe7 100%)", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", overflowY: "auto" }}>

      {/* Navbar */}
      <nav style={{ padding: "20px 60px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#3a1a6e", letterSpacing: 2 }}>cura</div>
        <button onClick={onLogin}
          style={{ padding: "10px 28px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: 24, color: "#3a1a6e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Log In
        </button>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", padding: "40px 40px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#5b2d8e", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>The Guard that never sleeps</div>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: "#3a1a6e", margin: "0 0 20px", lineHeight: 1.15, maxWidth: 700 }}>
          Keeping children safe<br />in every conversation
        </h1>
        <p style={{ fontSize: 16, color: "#5b2d8e", maxWidth: 500, lineHeight: 1.8, margin: "0 0 40px" }}>
          CURA monitors chats in real time, alerts parents to danger, and empowers children to stay safe online.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={onChildSignup}
            style={{ padding: "14px 36px", background: "#3a1a6e", border: "none", borderRadius: 28, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            I'm a Child — Get Started
          </button>
          <button onClick={onParentSignup}
            style={{ padding: "14px 36px", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.9)", borderRadius: 28, color: "#3a1a6e", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            I'm a Parent — Sign Up
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ padding: "32px 60px 48px", display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", flexShrink: 0 }}>
        {[
          { icon: "🛡️", title: "Real-time protection", desc: "Flags unsafe content the moment it appears" },
          { icon: "🔔", title: "Parent alerts", desc: "Instant notifications when danger is detected" },
          { icon: "🔒", title: "Privacy first", desc: "Safe monitoring without full surveillance" },
        ].map(f => (
          <div key={f.title} style={{ background: "rgba(255,255,255,0.35)", borderRadius: 16, padding: "24px 28px", minWidth: 200, maxWidth: 240, textAlign: "center", border: "1px solid rgba(255,255,255,0.7)" }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, color: "#3a1a6e", fontSize: 14, marginBottom: 6 }}>{f.title}</div>
            <div style={{ color: "#5b2d8e", fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}