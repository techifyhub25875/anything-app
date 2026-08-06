import { useState } from "react";
import { api } from "./api";
import ClientApp from "./pages/ClientApp";
import ProviderApp from "./pages/ProviderApp";

export default function App() {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("client");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  async function handleSendOtp() {
    if (!phone) return;
    await api.sendOtp(phone);
    setOtpSent(true);
  }

  async function handleVerify() {
    try {
      setError("");
      const { user } = await api.verifyOtp({ phone, otp, name, role });
      setUser(user);
    } catch (e) {
      setError(e.message);
    }
  }

  if (user) {
    return user.role === "client" ? <ClientApp user={user} /> : <ProviderApp user={user} />;
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <h2>Welcome to Anything</h2>
        <div className="sub">Login with your phone number</div>
      </div>
      <div className="body-pad">
        {!otpSent ? (
          <>
            <div className="section-label">Phone number</div>
            <input type="tel" placeholder="98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />

            <div className="section-label">I am a...</div>
            <div className="role-pick">
              <button className={`role-btn ${role === "client" ? "selected" : ""}`} onClick={() => setRole("client")}>Client</button>
              <button className={`role-btn ${role === "provider" ? "selected" : ""}`} onClick={() => setRole("provider")}>Provider</button>
            </div>

            <div className="section-label">Your name</div>
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />

            <button className="cta" onClick={handleSendOtp} disabled={!phone || !name}>Send OTP</button>
          </>
        ) : (
          <>
            <div className="section-label">Enter OTP</div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
              Phase 1 mock mode — use <b>1234</b> as the code.
            </p>
            <input type="text" placeholder="1234" value={otp} onChange={(e) => setOtp(e.target.value)} />
            {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>}
            <button className="cta" onClick={handleVerify} disabled={!otp}>Verify & Continue</button>
          </>
        )}
      </div>
    </div>
  );
}
