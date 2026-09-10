import React, { useState, useEffect } from 'react';
import {
  MapPin, ChevronDown, Bell, Search, Navigation,
  Zap, Wrench, Car, Scissors, Sparkles, MoreHorizontal,
  Star, CheckCircle2, ChevronRight, Home as HomeIcon,
  ClipboardList, Plus, Wallet, User
} from 'lucide-react';

// --- Category shortcut icon + color map ---
const CATEGORY_ICONS = {
  Electrician: { icon: Zap, color: '#6C63FF', bg: '#EFEDFF' },
  Plumber: { icon: Wrench, color: '#0E7C7B', bg: '#E3F3F2' },
  Mechanic: { icon: Wrench, color: '#F0A202', bg: '#FEF2DD' },
  Salon: { icon: Scissors, color: '#D8524A', bg: '#FBEBEA' },
  Cleaning: { icon: Sparkles, color: '#3E7CB1', bg: '#E9F2FA' },
};

function CategoryShortcut({ name, onClick }) {
  const meta = CATEGORY_ICONS[name] || { icon: MoreHorizontal, color: '#1B2140', bg: '#EEEEF3' };
  const Icon = meta.icon;
  return (
    <button className="cat-shortcut-card" onClick={onClick}>
      <div className="cat-shortcut-icon" style={{ background: meta.bg }}>
        <Icon size={22} color={meta.color} strokeWidth={2} />
      </div>
      <span>{name}</span>
    </button>
  );
}

function SponsoredCard({ logo, name, subtitle, rating, reviews, meta, offer }) {
  return (
    <div className="sponsored-card">
      <span className="sponsored-badge">Sponsored</span>
      <div className="sponsored-card-body">
        <div className="sponsored-logo">{logo}</div>
        <div className="sponsored-info">
          <h4>{name}</h4>
          <p className="sponsored-subtitle">{subtitle}</p>
          <div className="sponsored-rating">
            <Star size={13} fill="#F0A202" color="#F0A202" />
            <span>{rating}</span>
            <span className="sponsored-reviews">({reviews})</span>
          </div>
          <span className="sponsored-meta">{meta}</span>
          {offer && <span className="sponsored-offer">{offer}</span>}
        </div>
      </div>
    </div>
  );
}

function PopularServiceCard({ name, image, onClick }) {
  const meta = CATEGORY_ICONS[name] || { icon: MoreHorizontal, color: '#1B2140', bg: '#EEEEF3' };
  const Icon = meta.icon;
  return (
    <button className="popular-photo-card" onClick={onClick}>
      <div className="popular-photo-wrap">
        <img src={image} alt={name} />
        <div className="popular-photo-icon" style={{ background: meta.bg }}>
          <Icon size={16} color={meta.color} strokeWidth={2} />
        </div>
      </div>
      <span>{name}</span>
    </button>
  );
}

export default function ClientHome({
  user,
  categories = [],
  recentRequests = [],
  notificationCount = 0,
  onSelectCategory,
  onOpenSearch,
  onBookService,
  onNavigate, // ('requests' | 'newRequest' | 'wallet' | 'profile' | 'home')
}) {
  const shortcutNames = ['Electrician', 'Plumber', 'Mechanic', 'Salon', 'Cleaning'];

  return (
    <div className="client-home">
      {/* HEADER */}
      <div className="home-header">
        <button className="home-location" onClick={() => onNavigate('selectLocation')}>
          <MapPin size={18} color="#1B2140" />
          <div className="home-location-text">
            <span className="home-location-primary">
              {user?.addressShort || 'Connaught Place'} <ChevronDown size={14} />
            </span>
            <span className="home-location-secondary">{user?.city || 'New Delhi'}</span>
          </div>
        </button>

        <div className="home-logo">
          <img src="/anything-logo-icon.png" alt="ANYTHING" className="home-logo-icon" />
          <span className="home-logo-word">ANYTHING</span>
        </div>

        <div className="home-header-actions">
          <button className="home-bell" onClick={() => onNavigate('notifications')}>
            <Bell size={20} color="#1B2140" />
            {notificationCount > 0 && (
              <span className="home-bell-badge">{notificationCount}</span>
            )}
          </button>
          <button className="home-avatar" onClick={() => onNavigate('profile')}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} />
              : <User size={18} color="#1B2140" />}
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="home-search">
        <button className="home-search-input" onClick={onOpenSearch}>
          <Search size={18} color="#9A9AA5" />
          <span>What do you need today?</span>
        </button>
        <button className="home-nearme-btn" onClick={() => onNavigate('nearby')}>
          <Navigation size={14} />
          Near me
        </button>
      </div>

      {/* HERO BANNER */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <h1>
            Reliable help,<br />
            <span className="hero-highlight">right around you.</span>
          </h1>
          <p>Trusted professionals. On time. Every time.</p>
          <button className="hero-cta" onClick={onBookService}>Book a Service</button>
        </div>
        <img
          className="hero-banner-photo"
          src="/hero-provider.jpg"
          alt="Anything service professional"
        />
        <div className="hero-rating-card">
          <span className="hero-rating-value">4.8 <Star size={14} fill="#F0A202" color="#F0A202" /></span>
          <span className="hero-rating-label">Average Rating</span>
        </div>
      </div>

      {/* CATEGORY SHORTCUTS */}
      <div className="hscroll cat-shortcuts-row">
        {shortcutNames.map((name) => (
          <CategoryShortcut
            key={name}
            name={name}
            onClick={() => onSelectCategory(name)}
          />
        ))}
        <button className="cat-shortcut-card" onClick={() => onNavigate('explore')}>
          <div className="cat-shortcut-icon" style={{ background: '#EEEEF3' }}>
            <MoreHorizontal size={22} color="#1B2140" />
          </div>
          <span>More</span>
        </button>
      </div>

      {/* SPONSORED FOR YOU */}
      <div className="section-header">
        <h3>Sponsored for you</h3>
        <button onClick={() => onNavigate('exploreSponsored')}>View all <ChevronRight size={14} /></button>
      </div>
      <div className="hscroll">
        <SponsoredCard
          logo="❄️"
          name="CoolCare AC Services"
          subtitle="AC Repair & Installation"
          rating="4.9"
          reviews="320"
          meta="1.2 km away"
          offer="10% OFF on First Service"
        />
        <SponsoredCard
          logo="ߒ"
          name="Glow Salon"
          subtitle="Hair • Skin • Makeup"
          rating="4.8"
          reviews="180"
          meta=""
          offer="Flat 20% OFF Today"
        />
      </div>

      {/* POPULAR SERVICES — no prices */}
      <div className="section-header">
        <h3>Popular Services</h3>
        <button onClick={() => onNavigate('explore')}>View all <ChevronRight size={14} /></button>
      </div>
      <div className="hscroll">
        {['Electrician', 'Plumber', 'Mechanic', 'Salon', 'Cleaning'].map((name) => (
          <PopularServiceCard
            key={name}
            name={name}
            image={`/services/${name.toLowerCase()}.jpg`}
            onClick={() => onSelectCategory(name)}
          />
        ))}
      </div>

      {/* RECENT REQUESTS */}
      <div className="section-header">
        <h3>Recent Requests</h3>
        <button onClick={() => onNavigate('requests')}>View all <ChevronRight size={14} /></button>
      </div>
      <div className="recent-requests-list">
        {recentRequests.length === 0 && (
          <p className="recent-empty">No requests yet — book your first service above.</p>
        )}
        {recentRequests.map((r) => (
          <button
            key={r._id}
            className="recent-card"
            onClick={() => onNavigate(`requestDetails/${r._id}`)}
          >
            <div className="recent-card-status">
              <CheckCircle2 size={20} color="#0E7C7B" />
            </div>
            <div className="recent-card-info">
              <h4>{r.category?.name}{r.subType ? ` – ${r.subType}` : ''}</h4>
              <p>{r.clientLocation?.address || ''}</p>
              <span className="recent-card-date">
                Completed on {new Date(r.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="recent-card-right">
              {r.acceptedProvider?.avatarUrl && (
                <img className="recent-card-avatar" src={r.acceptedProvider.avatarUrl} alt="" />
              )}
              <span className="recent-card-rating">
                <Star size={12} fill="#F0A202" color="#F0A202" /> {r.rating || '—'}
              </span>
              <span className="recent-card-amount">₹{r.amountPaid}</span>
              <ChevronRight size={16} color="#9A9AA5" />
            </div>
          </button>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <button className="bottom-nav-item active" onClick={() => onNavigate('home')}>
          <HomeIcon size={20} />
          <span>Home</span>
        </button>
        <button className="bottom-nav-item" onClick={() => onNavigate('requests')}>
          <ClipboardList size={20} />
          <span>My Requests</span>
        </button>
        <button className="bottom-nav-fab" onClick={() => onNavigate('newRequest')}>
          <Plus size={24} color="#fff" />
        </button>
        <button className="bottom-nav-item" onClick={() => onNavigate('wallet')}>
          <Wallet size={20} />
          <span>Wallet</span>
        </button>
        <button className="bottom-nav-item" onClick={() => onNavigate('profile')}>
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
