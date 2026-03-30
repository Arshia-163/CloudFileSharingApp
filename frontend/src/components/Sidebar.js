import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatBytes } from '../utils/format';
import ProfileModal from './ProfileModal';

const navItems = [
  { icon: '⬛', label: 'Dashboard', path: '/' },
  { icon: '📁', label: 'My Files', path: '/files' },
  { icon: '⭐', label: 'Starred', path: '/starred' },
  { icon: '🔗', label: 'Shared', path: '/shared' },
  { icon: '🗑️', label: 'Trash', path: '/trash' },
];

const categories = [
  { icon: '🖼️', label: 'Images', path: '/files?category=image' },
  { icon: '📕', label: 'Documents', path: '/files?category=document' },
  { icon: '🎬', label: 'Videos', path: '/files?category=video' },
  { icon: '🎵', label: 'Audio', path: '/files?category=audio' },
];

export default function Sidebar({ storageStats }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('?')[0]) && location.search === (path.includes('?') ? '?' + path.split('?')[1] : '');
  };

  const usedPct = storageStats
    ? Math.min(100, (storageStats.used / storageStats.limit) * 100)
    : 0;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">☁️</div>
        <div className="sidebar-logo-text">Cloud<span>Share</span></div>
      </div>

      <div className="sidebar-section">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="sidebar-section" style={{ marginTop: 12 }}>
        <div className="sidebar-label">Categories</div>
        {categories.map(item => (
          <button
            key={item.path}
            className={`sidebar-item ${location.search.includes(item.path.split('?')[1] || 'NOPE') ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        {storageStats && (
          <div className="storage-bar-wrap">
            <div className="storage-bar-label">
              <span>Storage</span>
              <strong>{formatBytes(storageStats.used)} / {formatBytes(storageStats.limit)}</strong>
            </div>
            <div className="storage-bar-track">
              <div className="storage-bar-fill" style={{ width: `${usedPct}%` }} />
            </div>
          </div>
        )}
        <button 
          className="sidebar-item" 
          style={{ marginBottom: 4, cursor: 'pointer' }}
          onClick={() => setShowProfile(true)}
        >
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-1)' }}>{user?.name}</span>
        </button>
        <button className="sidebar-item" onClick={logout} style={{ color: 'var(--red)' }}>
          <span style={{ fontSize: '0.95rem' }}>🚪</span>
          Sign Out
        </button>
        <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      </div>
    </div>
  );
}
