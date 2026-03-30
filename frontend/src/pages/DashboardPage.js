import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatBytes } from '../utils/format';
import Sidebar from '../components/Sidebar';
import FileGrid from '../components/FileGrid';
import UploadModal from '../components/UploadModal';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '22', color }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function FilesView({ title, queryParams = {}, showUpload = true }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchParams] = useSearchParams();

  const category = searchParams.get('category') || queryParams.category;

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...queryParams };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get('/files', { params });
      setFiles(res.data.files);
    } catch {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [search, category, JSON.stringify(queryParams)]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} file(s)?`)) return;
    await Promise.all(selected.map(id => api.delete(`/files/${id}`).catch(() => {})));
    toast.success(`${selected.length} file(s) deleted`);
    setSelected([]);
    fetchFiles();
  };

  const handleBulkTrash = async () => {
    await Promise.all(selected.map(id => api.patch(`/files/${id}/trash`).catch(() => {})));
    toast.success(`${selected.length} file(s) moved to trash`);
    setSelected([]);
    fetchFiles();
  };

  return (
    <div className="fade-in">
      <div className="topbar">
        <h1 className="topbar-title">{title}</h1>
        <div className="topbar-search">
          <span className="topbar-search-icon">🔍</span>
          <input
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
          </div>
          {showUpload && (
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
              ⬆️ Upload
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {selected.length > 0 && (
          <div className="selection-bar">
            <span className="selection-bar-count">{selected.length} selected</span>
            <div className="selection-bar-actions">
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setSelected([])}>Clear</button>
              {queryParams.trash !== 'true' && (
                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleBulkTrash}>🗑️ Trash</button>
              )}
              <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleBulkDelete}>🔥 Delete</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <FileGrid
            files={files}
            viewMode={viewMode}
            onRefresh={fetchFiles}
            onSelect={handleSelect}
            selectedIds={selected}
          />
        )}
      </div>

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchFiles}
        />
      )}
    </div>
  );
}

function DashboardHome({ storageStats, onRefresh }) {
  const [recentFiles, setRecentFiles] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/files', { params: { limit: 8 } })
      .then(res => setRecentFiles(res.data.files))
      .catch(() => {});
  }, []);

  const usedPct = storageStats ? Math.min(100, (storageStats.used / storageStats.limit) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="topbar">
        <h1 className="topbar-title">Dashboard</h1>
        <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>⬆️ Upload Files</button>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-row">
          <StatCard icon="📁" label="Total Files" value={storageStats?.fileCount ?? '—'} color="#4f8ef7" />
          <StatCard icon="💾" label="Used Storage" value={storageStats ? formatBytes(storageStats.used) : '—'} color="#34d399" />
          <StatCard icon="🖼️" label="Images" value={storageStats ? formatBytes(storageStats.stats?.image || 0) : '—'} color="#a78bfa" />
          <StatCard icon="📕" label="Documents" value={storageStats ? formatBytes(storageStats.stats?.document || 0) : '—'} color="#fbbf24" />
        </div>

        {storageStats && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Storage Usage</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                {formatBytes(storageStats.used)} / {formatBytes(storageStats.limit)}
              </span>
            </div>
            <div className="storage-bar-track" style={{ height: 8, borderRadius: 4 }}>
              <div className="storage-bar-fill" style={{ width: `${usedPct}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Images', key: 'image', color: '#a78bfa' },
                { label: 'Videos', key: 'video', color: '#f87171' },
                { label: 'Docs', key: 'document', color: '#fbbf24' },
                { label: 'Other', key: 'other', color: '#4f8ef7' },
              ].map(({ label, key, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  {label}: <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-1)' }}>{formatBytes(storageStats.stats?.[key] || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Recent Files</h2>
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => navigate('/files')}>
            View all →
          </button>
        </div>

        {recentFiles.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">☁️</span>
            <h3>No files yet</h3>
            <p>Upload your first file to get started</p>
          </div>
        ) : (
          <FileGrid files={recentFiles} viewMode="grid" onRefresh={() => {
            api.get('/files', { params: { limit: 8 } }).then(res => setRecentFiles(res.data.files));
            onRefresh?.();
          }} />
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            api.get('/files', { params: { limit: 8 } }).then(res => setRecentFiles(res.data.files));
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [storageStats, setStorageStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/files/stats/storage');
      setStorageStats(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="app-layout">
      <Sidebar storageStats={storageStats} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DashboardHome storageStats={storageStats} onRefresh={fetchStats} />} />
          <Route path="/files" element={<FilesView title="My Files" />} />
          <Route path="/starred" element={<FilesView title="Starred" queryParams={{ starred: 'true' }} showUpload={false} />} />
          <Route path="/shared" element={<FilesView title="Shared Files" showUpload={false} />} />
          <Route path="/trash" element={<FilesView title="Trash" queryParams={{ trash: 'true' }} showUpload={false} />} />
        </Routes>
      </div>
    </div>
  );
}
