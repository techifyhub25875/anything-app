import { useState } from "react";
import { api } from "./api";
import ClientApp from "./pages/ClientApp";
import ProviderApp from "./pages/ProviderApp";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

const LANGUAGES = ["Hindi", "English", "Hinglish", "Marathi", "Gujarati", "Punjabi", "Tamil", "Telugu", "Kannada", "Bengali"];

export default function App() {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("");
  const [role, setRole] = useState("client");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const formValid = phone && name && email && address && state && language;

  async function handleSendOtp() {
    if (!formValid) return;
    await api.sendOtp(phone);
    setOtpSent(true);
  }
  async function handleVerify() {
    try {
      setError("");
      const { user } = await api.verifyOtp({ phone, otp, name, role, email, address, state, language });
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
              <button className={`role-btn ${role === "client" ? "selected" : ""}`} onClick={() => setRole("client")}>Personal Account</button>
              <button className={`role-btn ${role === "provider" ? "selected" : ""}`} onClick={() => setRole("provider")}>Business Account</button>
            </div>

            <div className="section-label">Your name</div>
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />

            <div className="section-label">Email</div>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

            <div className="section-label">Address</div>
            <input type="text" placeholder="House no, street, area" value={address} onChange={(e) => setAddress(e.target.value)} />

            <div className="section-label">State</div>
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="section-label">Preferred language</div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Select language</option>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>

            <button className="cta" onClick={handleSendOtp} disabled={!formValid}>Send OTP</button>
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
