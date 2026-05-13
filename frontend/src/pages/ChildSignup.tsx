import { useState } from "react";
import { signup } from "../api/auth";

interface Props {
  onSignup: () => void;
  onGoLogin: () => void;
}

export const SignupPage = ({ onSignup, onGoLogin }: Props) => {
  const [form, setForm] = useState({ name: "", dob: "", username: "", password: "", parentEmail: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSignup = async () => {
    if (!form.name || !form.dob || !form.username || !form.password || !form.parentEmail) {
      setError("Please fill in all fields."); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.parentEmail)) {
      setError("Please enter a valid parent email."); return;
    }
    if (!form.dob) { setError("Please enter your date of birth."); return; }
    const age = new Date().getFullYear() - new Date(form.dob).getFullYear();
    if (age < 5 || age > 17) { setError("You must be between 5 and 17 to register."); return; }
    setLoading(true); setError("");
    try {
      const { token, userId } = await signup(form);
      localStorage.setItem("cura_token", token);
      localStorage.setItem("cura_userId", userId);
      onSignup();
    } catch (e: any) {
      setError(e.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "name",        label: "Full Name",      type: "text" },
    { key: "dob",         label: "Date of Birth",  type: "date"},
    { key: "username",    label: "Username",       type: "text" },
    { key: "password",    label: "Password",       type: "password" },
    { key: "parentEmail", label: "Parent's Email", type: "email" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(135deg, #bde0fe 0%, #ba9fe7 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Outer card */}
      <div style={{
        display: "flex", width: 860, height: 580,
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
          justifyContent: "center", padding: "32px 44px",
          background: "rgba(189, 224, 254, 0.3)",
          overflowY: "auto",
        }}>
          {/* Branding */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 50, fontWeight: 800, color: "#5b2d8e", letterSpacing: 2, marginBottom: 5}}>cura</div>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5b2d8e", display: "block", marginBottom: 4 }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => update(f.key, e.target.value)}
                    type={
                      f.key === "password"
                        ? (showPassword ? "text" : "password")
                        : f.key === "dob" && !form.dob
                        ? "text"   // hides the mm/dd/yyyy placeholder when empty
                        : f.type
                    }
                    onFocus={e => {
                      if (f.key === "dob") e.target.type = "date";
                      e.target.style.borderBottomColor = "#5b2d8e";
                    }}
                    onBlur={e => {
                      if (f.key === "dob" && !form.dob) e.target.type = "text";
                      e.target.style.borderBottomColor = "#ba9fe7";
                    }}
                    max={f.key === "dob" ? new Date().toISOString().split("T")[0] : undefined}
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid #ba9fe7", padding: "8px 28px 8px 0", color: "#3a1a6e", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                  {f.key === "password" && (
                    <span onClick={() => setShowPassword(p => !p)}
                      style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#ba9fe7", fontSize: 15 }}>
                      <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} style={{ color: "#5b2d8e", fontSize: 15 }} />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {error && <div style={{ color: "#7f1d1d", fontSize: 11, textAlign: "center" }}>{error}</div>}

            <button onClick={handleSignup} disabled={loading}
              style={{ background: "rgba(186,159,231,0.5)", border: "none", borderRadius: 24, padding: "12px", color: "#3a1a6e", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, width: "100%", marginTop: 4, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(186,159,231,0.8)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(186,159,231,0.5)"}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <span style={{ color: "#5b2d8e", fontSize: 12}}>Already have an account?</span>
            <span onClick={onGoLogin} style={{ color: "#5b2d8e", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Log in</span>
          </div>
        </div>
      </div>
    </div>
  );
};