import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatBytes, formatDate, getFileIcon } from '../utils/format';

export default function SharePage() {
  const { token } = useParams();
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/share/access/${token}`)
      .then(res => {
        setFileInfo(res.data.file);
        setNeedsPassword(res.data.needsPassword);
      })
      .catch(err => setError(err.response?.data?.message || 'File not found'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = async () => {
    if (needsPassword && !password) {
      toast.error('Password required');
      return;
    }
    setDownloading(true);
    try {
      const res = await api.post(`/share/download/${token}`,
        { password },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.originalName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="share-page">
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  if (error) return (
    <div className="share-page">
      <div className="share-card">
        <span className="share-card-icon">⚠️</span>
        <h2 className="share-card-name">{error}</h2>
        <p className="share-card-meta">This link may be invalid, expired, or revoked.</p>
      </div>
    </div>
  );

  return (
    <div className="share-page">
      <div className="share-card fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 20px rgba(79,142,247,0.3)' }}>☁️</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>Cloud<span style={{ color: 'var(--accent)' }}>Share</span></div>
        </div>

        <span className="share-card-icon">{getFileIcon(fileInfo.mimetype)}</span>
        <h2 className="share-card-name">{fileInfo.originalName}</h2>
        <p className="share-card-meta">
          {formatBytes(fileInfo.size)} · Shared by {fileInfo.owner} · {formatDate(fileInfo.createdAt)}
        </p>

        {fileInfo.downloadCount > 0 && (
          <div style={{ display: 'inline-block', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 20, fontFamily: 'var(--mono)' }}>
            ⬇️ {fileInfo.downloadCount} download{fileInfo.downloadCount !== 1 ? 's' : ''}
          </div>
        )}

        {needsPassword && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ textAlign: 'left' }}>🔒 This file is password protected</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password to download"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDownload()}
            />
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: '0.9rem' }}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading
            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Downloading...</>
            : '⬇️ Download File'}
        </button>
      </div>
    </div>
  );
}
