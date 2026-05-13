import { useState } from "react";
import { login } from "../api/auth";

interface Props {
  onLogin: () => void;
  onGoSignup: () => void;
}

export const LoginPage = ({ onLogin, onGoSignup }: Props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const { token, userId } = await login({ username, password });
      localStorage.setItem("cura_token", token);
      localStorage.setItem("cura_userId", userId);
      onLogin();
    } catch (e: any) {
      setError(e.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(135deg, #bde0fe 0%, #ba9fe7 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Outer card */}
      <div style={{
        display: "flex", width: 860, height: 520,
        background: "rgba(189, 224, 254, 0.45)",
        borderRadius: 28, overflow: "hidden",
        boxShadow: "0 8px 48px rgba(186,159,231,0.35)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.6)",
      }}>

        {/* ── Left: Video as inner rounded card ── */}
        <div style={{ flex: 1, padding: 20, display: "flex" }}>
          <div style={{ flex: 1, borderRadius: 18, overflow: "hidden", position: "relative" }}>
            <video autoPlay loop muted playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
              <source src="/cura-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div style={{
          width: 380, display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "40px 44px",
          background: "rgba(189, 224, 254, 0.3)",
        }}>
          {/* Branding */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 50, fontWeight: 800, color: "#5b2d8e", letterSpacing: 2, marginBottom: 10}}>cura</div>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5b2d8e", display: "block", marginBottom: 6 }}>Username</label>
              <div style={{ position: "relative" }}>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid #ba9fe7", padding: "8px 28px 8px 0", color: "#3a1a6e", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderBottomColor = "#5b2d8e"}
                  onBlur={e => e.target.style.borderBottomColor = "#ba9fe7"} />
                <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", color: "#5b2d8e", fontSize: 15 }}>✉</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5b2d8e", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  type={showPassword ? "text" : "password"}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid #ba9fe7", padding: "8px 28px 8px 0", color: "#3a1a6e", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderBottomColor = "#5b2d8e"}
                  onBlur={e => e.target.style.borderBottomColor = "#ba9fe7"} />
                <span onClick={() => setShowPassword(p => !p)}
                  style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#ba9fe7", fontSize: 15 }}>
                  <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} style={{ color: "#5b2d8e", fontSize: 15 }} />
                </span>
              </div>
            </div>

            {error && <div style={{ color: "#7f1d1d", fontSize: 11, textAlign: "center" }}>{error}</div>}

            <button onClick={handleLogin} disabled={loading}
              style={{ background: "rgba(186,159,231,0.5)", border: "none", borderRadius: 24, padding: "12px", color: "#3a1a6e", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, width: "100%", marginTop: 4, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(186,159,231,0.8)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(186,159,231,0.5)"}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          {/* Bottom links */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <span onClick={onGoSignup} style={{ color: "#5b2d8e", fontSize: 12, cursor: "pointer" }}>Create an account</span>
            <span style={{ color: "#5b2d8e", fontSize: 12, cursor: "pointer" }}>Forgot password</span>
          </div>
        </div>
      </div>
    </div>
  );
};