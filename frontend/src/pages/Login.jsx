import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import { AlertTriangle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUser();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await login(usernameOrEmail, password);
      navigate("/");
    } catch (err) {
      setErrorMsg(err.message || "Invalid username/email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
        padding: 24,
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* Ambient Diagonal Magenta Glow Aura Passing Through Card Center */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          left: "25%",
          width: "50%",
          height: "30%",
          background: "linear-gradient(135deg, rgba(236, 72, 153, 0.4) 0%, rgba(168, 85, 247, 0.4) 50%, rgba(147, 51, 234, 0.3) 100%)",
          filter: "blur(70px)",
          transform: "rotate(-12deg)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Top-Right Decorative Wave Lines SVG */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "450px",
          height: "450px",
          pointerEvents: "none",
          zIndex: 2,
          opacity: 0.85,
        }}
        viewBox="0 0 400 400"
        fill="none"
      >
        <path d="M50 0 C 150 100, 250 50, 400 200" stroke="url(#waveGrad1)" strokeWidth="1.5" />
        <path d="M80 0 C 170 120, 270 70, 400 230" stroke="url(#waveGrad1)" strokeWidth="1.5" />
        <path d="M110 0 C 190 140, 290 90, 400 260" stroke="url(#waveGrad1)" strokeWidth="1.5" />
        <path d="M140 0 C 210 160, 310 110, 400 290" stroke="url(#waveGrad1)" strokeWidth="1.5" />
        <path d="M170 0 C 230 180, 330 130, 400 320" stroke="url(#waveGrad1)" strokeWidth="1.5" />
        <path d="M200 0 C 250 200, 350 150, 400 350" stroke="url(#waveGrad1)" strokeWidth="1.5" />
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottom-Left Decorative Wave Lines SVG */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "450px",
          height: "450px",
          pointerEvents: "none",
          zIndex: 2,
          opacity: 0.85,
        }}
        viewBox="0 0 400 400"
        fill="none"
      >
        <path d="M0 200 C 150 250, 250 350, 350 400" stroke="url(#waveGrad2)" strokeWidth="1.5" />
        <path d="M0 170 C 130 230, 230 330, 320 400" stroke="url(#waveGrad2)" strokeWidth="1.5" />
        <path d="M0 140 C 110 210, 210 310, 290 400" stroke="url(#waveGrad2)" strokeWidth="1.5" />
        <path d="M0 110 C 90 190, 190 290, 260 400" stroke="url(#waveGrad2)" strokeWidth="1.5" />
        <path d="M0 80 C 70 170, 170 270, 230 400" stroke="url(#waveGrad2)" strokeWidth="1.5" />
        <defs>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Glassmorphism Container Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          height: 480,
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1.5px solid rgba(255, 255, 255, 0.85)",
          borderRadius: 42,
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.06), 0 4px 20px rgba(168, 85, 247, 0.08)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          position: "relative",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* LEFT COLUMN: Logo, Title, Subtitle, Domain Link */}
        <div
          style={{
            flex: "1 1 50%",
            padding: "50px 54px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Logo */}
          <div style={{ fontSize: 34, fontWeight: 900, color: "#1E293B", letterSpacing: "-0.04em" }}>
            realtypulse<span style={{ color: "#2563EB" }}>.</span>
          </div>

          {/* Headline & Description */}
          <div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1.15,
                margin: "0 0 16px",
                letterSpacing: "-0.03em",
              }}
            >
              RealtyPulse <br />
              Sales OS
            </h1>

            <p
              style={{
                fontSize: 13.5,
                color: "#475569",
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 340,
                fontWeight: 500,
              }}
            >
              Next-generation AI real estate operating system designed for modern brokerage teams to manage clients, communications, and deal pipelines.
            </p>
          </div>

          {/* Website URL */}
          <div style={{ fontSize: 13, color: "#334155", fontWeight: 700, letterSpacing: "-0.01em" }}>
            www.realtypulse.ai
          </div>
        </div>

        {/* CENTER BLACK VERTICAL DIVIDER LINE */}
        <div
          style={{
            width: 4,
            height: "65%",
            background: "#0F172A",
            borderRadius: 999,
          }}
        />

        {/* RIGHT COLUMN: Sign In Header, Inputs, Login Button */}
        <div
          style={{
            flex: "1 1 50%",
            padding: "50px 54px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: 24,
              textAlign: "center",
              letterSpacing: "-0.02em",
            }}
          >
            Login
          </h2>

          <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 300, margin: "0 auto" }}>
            {/* Username Input */}
            <div style={{ marginBottom: 14 }}>
              <input
                required
                type="text"
                placeholder="Username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(255, 255, 255, 0.9)",
                  background: "rgba(255, 255, 255, 0.65)",
                  backdropFilter: "blur(10px)",
                  color: "#0F172A",
                  fontSize: 13.5,
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.background = "#FFFFFF";
                  e.target.style.borderColor = "#CBD5E1";
                }}
                onBlur={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.65)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.9)";
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: 20 }}>
              <input
                required
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(255, 255, 255, 0.9)",
                  background: "rgba(255, 255, 255, 0.65)",
                  backdropFilter: "blur(10px)",
                  color: "#0F172A",
                  fontSize: 13.5,
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.background = "#FFFFFF";
                  e.target.style.borderColor = "#CBD5E1";
                }}
                onBlur={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.65)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.9)";
                }}
              />
            </div>

            {errorMsg && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: "#DC2626",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <AlertTriangle size={14} /> {errorMsg}
              </div>
            )}

            {/* Login Button */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px 36px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 999,
                  background: "#FFFFFF",
                  color: "#0F172A",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.05)";
                  }
                }}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
