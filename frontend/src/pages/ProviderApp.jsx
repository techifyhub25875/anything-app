import { useState, useEffect, useRef } from "react";
import { api } from "../api";

export default function ProviderApp({ user }) {
  const [provider, setProvider] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubTypes, setSelectedSubTypes] = useState([]);
  const [location, setLocation] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [earnings, setEarnings] = useState(null);
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharPhoto, setAadharPhoto] = useState(null);
  const pollRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getProviderByUser(user._id).then((r) => setProvider(r.provider));
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 28.6139, lng: 77.209 })
    );
  }, []);

  function handleAadharPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAadharPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  async function completeRegistration() {
    const { provider: p } = await api.registerProvider({
      userId: user._id,
      categoryId: selectedCategory._id,
      subTypes: selectedSubTypes,
      lat: location.lat,
      lng: location.lng,
      aadharNumber,
      aadharPhoto,
    });
    setProvider(p);
  }

  async function toggleDuty() {
    const next = !provider.onDuty;
    const { provider: updated } = await api.setDuty(provider._id, {
      onDuty: next,
      lat: location?.lat,
      lng: location?.lng,
    });
    setProvider(updated);
    if (next) startPolling(updated._id);
    else stopPolling();
  }

  function startPolling(providerId) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const { job } = await api.getIncoming(providerId);
      if (job && (!incoming || job._id !== incoming._id)) {
        setIncoming(job);
        beep();
      } else if (!job) {
        setIncoming(null);
      }
    }, 2500);
  }

  function stopPolling() {
    clearInterval(pollRef.current);
    clearInterval(tickRef.current);
    setIncoming(null);
  }

  useEffect(() => {
    if (!incoming) return;
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const secs = Math.max(0, Math.round((new Date(incoming.activeProviderExpiresAt) - Date.now()) / 1000));
      setSecondsLeft(secs);
      if (secs <= 0) {
        setIncoming(null);
        clearInterval(tickRef.current);
      }
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [incoming]);

  useEffect(() => () => { clearInterval(pollRef.current); clearInterval(tickRef.current); }, []);

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  }

  async function respond(action) {
    await api.respond(incoming._id, { providerId: provider._id, action });
    setIncoming(null);
    if (action === "accept") {
      loadEarnings();
    }
  }

  async function loadEarnings() {
    const data = await api.getEarnings(provider._id);
    setEarnings(data);
  }

  useEffect(() => {
    if (provider) loadEarnings();
  }, [provider?._id]);

  const groupedCategories = categories.reduce((acc, c) => {
    const g = c.group || "Other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(c);
    return acc;
  }, {});

  const searchResults = search.trim()
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.group || "").toLowerCase().includes(search.toLowerCase())
      )
    : null;

  function renderCatCard(c) {
    return (
      <div
        key={c._id}
        className="cat-card"
        style={{ borderColor: selectedCategory?._id === c._id ? "var(--teal)" : undefined }}
        onClick={() => { setSelectedCategory(c); setSelectedSubTypes([]); }}
      >
        <span className="emoji">{c.icon}</span>
        <div className="label">{c.name}</div>
      </div>
    );
  }

  if (!provider) {
    const canRegister = selectedCategory && selectedSubTypes.length > 0 && location && aadharNumber && aadharPhoto;
    return (
      <div className="app-shell">
        <div className="topbar">
          <img src="/anything-logo-icon.png" alt="Anything" style={{ height: 28, marginBottom: 10 }} /> 
          <h2>Provider registration</h2>
          <div className="sub">Apni category chunein</div>
        </div>
        <div className="body-pad">
          <div className="section-label">Search category</div>
          <div className="search-bar-wrap">
            <span className="search-icon">ߔ</span>
            <input
              className="search-bar"
              type="text"
              placeholder="Electrician, Salon, Car wash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {searchResults ? (
            <>
              <div className="section-label">Results ({searchResults.length})</div>
              {searchResults.length === 0 ? (
                <p className="center-msg">Koi category nahi mili "{search}" ke liye.</p>
              ) : (
                <div className="cat-grid">{searchResults.map(renderCatCard)}</div>
              )}
            </>
          ) : (
            Object.entries(groupedCategories).map(([group, cats]) => (
              <div key={group} className="group-section">
                <div className="group-heading">{group}</div>
                <div className="cat-grid">{cats.map(renderCatCard)}</div>
              </div>
            ))
          )}

          {selectedCategory && (
            <>
              <div className="section-label">Sub-types aap handle karte hain</div>
              <div className="chip-row">
                {selectedCategory.subTypes.map((s) => (
                  <div
                    key={s}
                    className={`chip ${selectedSubTypes.includes(s) ? "selected" : ""}`}
                    onClick={() =>
                      setSelectedSubTypes((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                  >
                    {s}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="section-label">Aadhar number</div>
          <input
            type="text"
            placeholder="XXXX XXXX XXXX"
            maxLength={14}
            value={aadharNumber}
            onChange={(e) => setAadharNumber(e.target.value)}
          />

          <div className="section-label">Aadhar card photo</div>
          <input type="file" accept="image/*" onChange={handleAadharPhoto} />
          {aadharPhoto && (
            <img src={aadharPhoto} alt="Aadhar preview" style={{ maxWidth: "100%", marginTop: 8, borderRadius: 8 }} />
          )}
        </div>
        <button className="cta" disabled={!canRegister} onClick={completeRegistration}>
          Registration complete karein
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/anything-logo-icon.png" alt="Anything" style={{ height: 28, marginBottom: 10 }} /> 
        <h2>{user.name}</h2>
        <div className="sub">{provider.category?.name}</div>
      </div>
      <div className="body-pad">
        <div className="toggle-card">
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>
              {provider.onDuty ? "On Duty" : "Off Duty"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
              {provider.onDuty ? "4 km radius ke andar visible hain" : "Requests nahi milengi"}
            </div>
          </div>
          <div className={`switch ${provider.onDuty ? "on" : ""}`} onClick={toggleDuty}>
            <div className="knob" />
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-box"><div className="num">₹{earnings?.totalEarnings ?? 0}</div><div className="lbl">Total kamai</div></div>
          <div className="stat-box"><div className="num">₹{earnings?.commissionOwed ?? 0}</div><div className="lbl">Commission owed (unbilled)</div></div>
          <div className="stat-box"><div className="num">{provider.rating}★</div><div className="lbl">Rating</div></div>
          <div className="stat-box"><div className="num">{provider.radiusKm} km</div><div className="lbl">Coverage</div></div>
        </div>
      </div>

      {incoming && (
        <div className="req-overlay">
          <div className="req-sheet">
            <div className="req-top">
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16 }}>
                  {incoming.category?.icon} {incoming.category?.name} request
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{incoming.subType}</div>
              </div>
              <div className="req-timer-ring">
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </div>
            </div>
            <div className="req-desc">"{incoming.description}"</div>
            <div className="req-actions">
              <button className="btn-reject" onClick={() => respond("reject")}>Reject</button>
              <button className="btn-accept" onClick={() => respond("accept")}>Accept</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
