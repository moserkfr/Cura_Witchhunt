import { useState } from "react";
import { parentSignup } from "../api/auth";

interface Props {
  onSignup: () => void;
  onGoLogin: () => void;
}

export const ParentSignupPage = ({ onSignup, onGoLogin }: Props) => {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) { setError("Please fill in all required fields."); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setError("Please enter a valid email."); return; }
    setLoading(true); setError("");
    try {
      const { token, userId } = await parentSignup(form);
      localStorage.setItem("cura_token", token);
      localStorage.setItem("cura_userId", userId);
      localStorage.setItem("cura_role", "parent");
      onSignup();
    } catch (e: any) {
      setError(e.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "name",     label: "Full Name",       type: "text" },
    { key: "email",    label: "Email Address",   type: "email" },
    { key: "password", label: "Password",        type: "password" },
    { key: "phone",    label: "Phone (optional)", type: "tel" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg, #bde0fe 0%, #ba9fe7 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: "flex", width: 860, height: 540, background: "rgba(189,224,254,0.45)", borderRadius: 28, overflow: "hidden", boxShadow: "0 8px 48px rgba(186,159,231,0.35)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)" }}>

        <div style={{ flex: 1, padding: 20, display: "flex" }}>
          <div style={{ flex: 1, borderRadius: 18, overflow: "hidden" }}>
            <video autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
              <source src="/cura-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <div style={{ width: 380, display: "flex", flexDirection: "column", justifyContent: "center", padding: "36px 44px", background: "rgba(189,224,254,0.3)", overflowY: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 50, fontWeight: 800, color: "#5b2d8e", letterSpacing: 2 }}>cura</div>
            <div style={{ color: "#7b5ea7", fontSize: 11, marginTop: 2 }}>Parent Portal</div>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#3a1a6e", margin: "0 0 20px", textAlign: "center" }}>Create Parent Account</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#5b2d8e", display: "block", marginBottom: 4 }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => update(f.key, e.target.value)}
                    type={f.key === "password" ? (showPassword ? "text" : "password") : f.type}
                    style={{ width: "100%", background: "rgba(255,255,255,0.6)", border: "1.5px solid #ba9fe7", borderRadius: 10, padding: "10px 36px 10px 12px", color: "#3a1a6e", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    onFocus={e => e.target.style.borderColor = "#5b2d8e"}
                    onBlur={e => e.target.style.borderColor = "#ba9fe7"}
                  />
                  {f.key === "password" && (
                    <span onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                      <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} style={{ color: "#5b2d8e", fontSize: 14 }} />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {error && <div style={{ color: "#7f1d1d", fontSize: 11, textAlign: "center" }}>{error}</div>}

            <button onClick={handleSignup} disabled={loading}
              style={{ background: "rgba(186,159,231,0.5)", border: "none", borderRadius: 24, padding: "12px", color: "#3a1a6e", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, width: "100%", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(186,159,231,0.8)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(186,159,231,0.5)"}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <span style={{ color: "#5b2d8e", fontSize: 12 }}>Already have an account?</span>
            <span onClick={onGoLogin} style={{ color: "#5b2d8e", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Log in</span>
          </div>
        </div>
      </div>
    </div>
  );
};