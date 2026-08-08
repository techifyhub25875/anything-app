import { useState, useEffect, useRef } from "react";
import { api } from "../api";

export default function ClientApp({ user }) {
  const [screen, setScreen] = useState("home");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubType, setSelectedSubType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [job, setJob] = useState(null);
  const [amount, setAmount] = useState("");
  const [rating, setRating] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 28.6139, lng: 77.209 }) // fallback: Delhi, for testing without GPS permission
    );
  }, []);

  function pickCategory(cat) {
    setSelectedCategory(cat);
    setSelectedSubType(cat.subTypes[0] || "");
    setScreen("describe");
  }

  async function submitRequest() {
    const { job } = await api.createRequest({
      clientId: user._id,
      categoryId: selectedCategory._id,
      subType: selectedSubType,
      description,
      lat: location.lat,
      lng: location.lng,
    });
    setJob(job);
    setScreen("searching");
    startPolling(job._id);
  }

  function startPolling(jobId) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const { job: updated } = await api.getRequest(jobId);
      setJob(updated);
      if (updated.status === "accepted") {
        clearInterval(pollRef.current);
        setScreen("found");
      } else if (updated.status === "no_provider_found") {
        clearInterval(pollRef.current);
      }
    }, 2000);
  }

  useEffect(() => () => clearInterval(pollRef.current), []);

  async function submitCompletion() {
    await api.completeRequest(job._id, {
      amountPaid: Number(amount),
      rating,
    });
    setScreen("home");
    setJob(null);
    setAmount("");
    setRating(0);
  }

  if (screen === "home") {
    return (
      <div className="app-shell">
        <div className="topbar">
          <h2>Namaste, {user.name.split(" ")[0]} 👋</h2>
          <div className="sub">Aaj kya chahiye?</div>
        </div>
        <div className="body-pad">
          <div className="section-label">Categories</div>
          <div className="cat-grid">
            {categories.map((c) => (
              <div key={c._id} className="cat-card" onClick={() => pickCategory(c)}>
                <span className="emoji">{c.icon}</span>
                <div className="label">{c.name}</div>
                <div className="desc">{c.description}</div>
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="center-msg">
              No categories yet — call POST /api/categories/seed once on your backend to load Phase 1 categories.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (screen === "describe") {
    return (
      <div className="app-shell">
        <div className="topbar">
          <h2>{selectedCategory.name}</h2>
          <div className="sub">Apni problem batayein</div>
        </div>
        <div className="body-pad">
          <div className="section-label">Kaam ka type</div>
          <div className="chip-row">
            {selectedCategory.subTypes.map((s) => (
              <div key={s} className={`chip ${selectedSubType === s ? "selected" : ""}`} onClick={() => setSelectedSubType(s)}>
                {s}
              </div>
            ))}
          </div>
          <div className="section-label">Detail</div>
          <textarea rows={4} placeholder="Apni problem yahan likhein..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button className="cta" disabled={!description || !location} onClick={submitRequest}>
          Provider dhundo
        </button>
      </div>
    );
  }

  if (screen === "searching") {
    return (
      <div className="app-shell">
        <div className="topbar">
          <h2>Dhoonda ja raha hai</h2>
          <div className="sub">4 km ke andar providers</div>
        </div>
        <div className="body-pad">
          {job?.status === "searching" && job.activeProvider && (
            <p className="center-msg">
              Request bheji gayi — response ka wait ho raha hai ({job.activeProvider.rating}★, nearby)
            </p>
          )}
          {job?.status === "no_provider_found" && (
            <p className="center-msg">
              Abhi koi provider available nahi hai aapke area mein. Thodi der baad try karein.
            </p>
          )}
        </div>
        {job?.status === "no_provider_found" && (
          <button className="cta" onClick={() => setScreen("home")}>Home par wapas jayein</button>
        )}
      </div>
    );
  }

  if (screen === "found" && job) {
    const p = job.acceptedProvider;
    return (
      <div className="app-shell">
        <div className="topbar">
          <h2>Provider mil gaya</h2>
          <div className="sub">Raaste mein hai</div>
        </div>
        <div className="body-pad">
          <div className="provider-card">
            <div className="provider-head">
              <div className="avatar">{p?.rating ? "P" : "P"}</div>
              <div>
                <div className="provider-name">Provider #{p?._id?.slice(-4)}</div>
                <div className="provider-meta">Rating: {p?.rating}★</div>
              </div>
            </div>
          </div>
        </div>
        <button className="cta" onClick={() => setScreen("complete")}>Kaam complete hua</button>
      </div>
    );
  }

  if (screen === "complete" && job) {
    const commission = amount ? Math.round(Number(amount) * 0.1) : 0;
    return (
      <div className="app-shell">
        <div className="topbar">
          <h2>Kaam complete</h2>
          <div className="sub">Payment aur rating</div>
        </div>
        <div className="body-pad">
          <div className="section-label">Aapne kitna pay kiya?</div>
          <input type="number" placeholder="₹ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <div className="section-label">Kaam kaisa raha?</div>
          <div className="star-row">
            {[1, 2, 3, 4, 5].map((v) => (
              <span key={v} className={v <= rating ? "on" : ""} onClick={() => setRating(v)}>★</span>
            ))}
          </div>

          <div className="commission-note">
            ℹ️ Is amount ka 10% (₹{commission}) provider ke agle payout se commission ke roop mein tracked hoga.
          </div>
        </div>
        <button className="cta" disabled={!amount || !rating} onClick={submitCompletion}>Submit karein</button>
      </div>
    );
  }

  return null;
}
