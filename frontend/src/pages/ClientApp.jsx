import { useState, useEffect, useRef } from "react";
import { api } from "../api";

export default function ClientApp({ user }) {
  const [screen, setScreen] = useState("home");
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubType, setSelectedSubType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [recentRequests, setRecentRequests] = useState([]);
  const [job, setJob] = useState(null);
  const [amount, setAmount] = useState("");
  const [rating, setRating] = useState(0);
  const pollRef = useRef(null);
  const categoriesRef = useRef(null);
  const recentRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getRecentRequests(user._id).then((r) => setRecentRequests(r.jobs || [])).catch(() => {});
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 28.6139, lng: 77.209 }) // fallback: Delhi, for testing without GPS permission
    );
  }, []);

  // Reverse-geocodes the GPS coordinates into a human-readable area/city name
  // for the header pill (e.g. "Connaught Place, Delhi"). Uses OpenStreetMap's
  // free Nominatim API — no API key needed. Purely cosmetic; never blocks or
  // affects the actual matching flow, which uses raw lat/lng directly.
  useEffect(() => {
    if (!location) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`)
      .then((r) => r.json())
      .then((d) => {
        const a = d.address || {};
        const area = a.suburb || a.neighbourhood || a.road || a.city_district || "";
        const city = a.city || a.town || a.state_district || a.state || "";
        const label = [area, city].filter(Boolean).join(", ");
        setLocationLabel(label || "Location detected");
      })
      .catch(() => setLocationLabel(""));
  }, [location]);

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
    api.getRecentRequests(user._id).then((r) => setRecentRequests(r.jobs || [])).catch(() => {});
  }

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

  function scrollToRef(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function statusLabel(status) {
    return {
      searching: "Searching",
      accepted: "In Progress",
      completed: "Completed",
      no_provider_found: "No provider found",
    }[status] || status;
  }

  if (screen === "home") {
    return (
      <div className="app-shell">
        {/* Premium header: location + logo + notification */}
        <div className="home-header">
          <div className="location-pill">
            <span className="pin">ߓ</span>
            <span className="city">{locationLabel || "Detecting location..."}</span>
          </div>
          <img src="/anything-logo-icon.png" alt="Anything" className="brand-mark" />
          <div className="bell">ߔ</div>
        </div>

        {/* Large search area */}
        <div className="home-search-wrap" ref={searchRef}>
          <div className="home-search">
            <span className="icon">ߔ</span>
            <input
              type="text"
              placeholder="What do you need today?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="body-pad" style={{ paddingTop: 4 }}>
          {searchResults ? (
            <>
              <div className="section-header">
                <div className="title">Results ({searchResults.length})</div>
              </div>
              {searchResults.length === 0 ? (
                <p className="center-msg">Koi category nahi mili "{search}" ke liye.</p>
              ) : (
                <div className="cat-grid">
                  {searchResults.map((c) => (
                    <div key={c._id} className="cat-card" onClick={() => pickCategory(c)}>
                      <span className="emoji">{c.icon}</span>
                      <div className="label">{c.name}</div>
                      <div className="desc">{c.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Hero section */}
              <div className="hero-banner">
                <h1>Reliable help, right around you.</h1>
                <p>Trusted local professionals. Simple, fast and reliable.</p>
                <button className="hero-cta" onClick={() => scrollToRef(categoriesRef)}>
                  Book a Service
                </button>
              </div>

              {/* Popular services — horizontal scroll, uses real category data */}
              {categories.length > 0 && (
                <>
                  <div className="section-header">
                    <div className="title">Popular Services</div>
                  </div>
                  <div className="hscroll">
                    {categories.slice(0, 8).map((c) => (
                      <div key={c._id} className="popular-card" onClick={() => pickCategory(c)}>
                        <div className="icon-wrap">{c.icon}</div>
                        <div className="name">{c.name}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Sponsored — UI-only placeholder, not wired to any backend/ad system yet */}
              <div className="section-header">
                <div className="title">Featured for you</div>
              </div>
              <div className="sponsored-card">
                <span className="sponsored-tag">Sponsored</span>
                <div className="thumb">⭐</div>
                <div>
                  <div className="name">Sharma Electricals</div>
                  <div className="desc">Same-day electrical repairs & installations</div>
                  <div className="meta-row">
                    <span>★ 4.8</span>
                    <span>1.2 km away</span>
                  </div>
                  <div className="offer-badge">10% OFF first booking</div>
                </div>
              </div>

              {/* All categories, grouped */}
              <div ref={categoriesRef}>
                <div className="section-header">
                  <div className="title">Browse All</div>
                </div>
                {Object.entries(groupedCategories).map(([group, cats]) => (
                  <div key={group} className="group-section">
                    <div className="group-heading">{group}</div>
                    <div className="cat-grid">
                      {cats.map((c) => (
                        <div key={c._id} className="cat-card" onClick={() => pickCategory(c)}>
                          <span className="emoji">{c.icon}</span>
                          <div className="label">{c.name}</div>
                          <div className="desc">{c.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="center-msg">
                    No categories yet — call POST /api/categories/seed once on your backend to load categories.
                  </p>
                )}
              </div>

              {/* Recent requests — real data from backend */}
              <div ref={recentRef}>
                <div className="section-header">
                  <div className="title">Recent Requests</div>
                </div>
                {recentRequests.length === 0 ? (
                  <p className="center-msg">Abhi tak koi request nahi ki hai. Upar se koi service book karein.</p>
                ) : (
                  recentRequests.map((r) => (
                    <div key={r._id} className="recent-card">
                      <div>
                        <div className="name">{r.category?.icon} {r.category?.name} – {r.subType}</div>
                        <div className="sub">{r.description?.slice(0, 40)}</div>
                        <span className={`status-pill ${r.status}`}>{statusLabel(r.status)}</span>
                      </div>
                      {r.status === "completed" && (
                        <div className="right">
                          <div className="amount">₹{r.amountPaid}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Trust strip */}
              <div className="trust-strip">
                <div className="item"><span className="ic">✅</span><div className="lbl">Verified Providers</div></div>
                <div className="item"><span className="ic">ߓ</span><div className="lbl">Nearby Services</div></div>
                <div className="item"><span className="ic">ߔ</span><div className="lbl">Secure Experience</div></div>
                <div className="item"><span className="ic">⚡</span><div className="lbl">Fast Response</div></div>
              </div>
            </>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="bottom-nav">
          <button className="nav-item active" onClick={() => scrollToRef(searchRef)}>
            <span className="ic">ߏ</span>Home
          </button>
          <button className="nav-item" onClick={() => scrollToRef(categoriesRef)}>
            <span className="ic">ߓ</span>Explore
          </button>
          <button className="nav-item center-action" onClick={() => scrollToRef(searchRef)}>
            <span className="ic">+</span>
          </button>
          <button className="nav-item" onClick={() => scrollToRef(recentRef)}>
            <span className="ic">ߧ</span>Requests
          </button>
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
