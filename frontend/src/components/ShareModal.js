import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ShareModal({ file, onClose }) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(file.shareToken
    ? `${window.location.origin}/share/${file.shareToken}`
    : null);
  const [expiresIn, setExpiresIn] = useState('');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/share/${file._id}`, {
        expiresIn: expiresIn ? Number(expiresIn) : undefined,
        password: password || undefined
      });
      setShareUrl(res.data.shareUrl);
      toast.success('Share link created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await api.delete(`/share/${file._id}`);
      setShareUrl(null);
      toast.success('Share link revoked');
    } catch (err) {
      toast.error('Failed to revoke link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Share File</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.4rem' }}>📄</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{file.originalName}</div>
          </div>
        </div>

        {!shareUrl ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Expiry (hours)</label>
                <select
                  className="form-input"
                  value={expiresIn}
                  onChange={e => setExpiresIn(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Never expires</option>
                  <option value="1">1 hour</option>
                  <option value="24">24 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">7 days</option>
                  <option value="720">30 days</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Password (optional)</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Leave blank for open"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleShare} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> Creating...</> : '🔗 Generate Share Link'}
            </button>
          </>
        ) : (
          <>
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--mono)' }}>{shareUrl}</span>
              <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '0.78rem', flexShrink: 0 }} onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleRevoke} disabled={loading}>
                🚫 Revoke Link
              </button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleShare} disabled={loading}>
                🔄 Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
