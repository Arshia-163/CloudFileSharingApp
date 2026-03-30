import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatBytes, formatDate, getFileIcon } from '../utils/format';
import ShareModal from './ShareModal';

function ContextMenu({ x, y, file, onClose, onRefresh }) {
  const ref = useRef();

  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const res = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = file.originalName; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
    onClose();
  };

  const handleStar = async () => {
    try {
      await api.put(`/files/${file._id}`, { isStarred: !file.isStarred });
      toast.success(file.isStarred ? 'Removed from starred' : 'Added to starred');
      onRefresh?.();
    } catch { toast.error('Action failed'); }
    onClose();
  };

  const handleTrash = async () => {
    try {
      const res = await api.patch(`/files/${file._id}/trash`);
      toast.success(res.data.message);
      onRefresh?.();
    } catch { toast.error('Action failed'); }
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete "${file.originalName}"?`)) { onClose(); return; }
    try {
      await api.delete(`/files/${file._id}`);
      toast.success('File deleted');
      onRefresh?.();
    } catch { toast.error('Delete failed'); }
    onClose();
  };

  return (
    <div ref={ref} className="context-menu" style={{ left: x, top: y }}>
      <button className="context-item" onClick={handleDownload}>⬇️ Download</button>
      <button className="context-item" onClick={handleStar}>
        {file.isStarred ? '☆ Unstar' : '⭐ Star'}
      </button>
      <div className="context-divider" />
      <button className="context-item" onClick={handleTrash}>
        {file.isTrashed ? '♻️ Restore' : '🗑️ Move to Trash'}
      </button>
      {file.isTrashed && (
        <button className="context-item danger" onClick={handleDelete}>🔥 Delete Forever</button>
      )}
    </div>
  );
}

export default function FileGrid({ files, viewMode = 'grid', onRefresh, onSelect, selectedIds = [] }) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleDownload = async (file, e) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = file.originalName; a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloading...');
    } catch { toast.error('Download failed'); }
  };

  const handleStar = async (file, e) => {
    e.stopPropagation();
    try {
      await api.put(`/files/${file._id}`, { isStarred: !file.isStarred });
      onRefresh?.();
    } catch { toast.error('Action failed'); }
  };

  const handleShare = (file, e) => {
    e.stopPropagation();
    setShareFile(file);
  };

  if (!files.length) return (
    <div className="empty-state">
      <span className="empty-state-icon">📂</span>
      <h3>No files here</h3>
      <p>Upload files to get started</p>
    </div>
  );

  if (viewMode === 'list') return (
    <>
      <div className="files-list">
        <div className="files-list-header">
          <span></span>
          <span>Name</span>
          <span style={{ textAlign: 'right' }}>Size</span>
          <span style={{ textAlign: 'right' }}>Modified</span>
          <span></span>
        </div>
        {files.map(file => (
          <div
            key={file._id}
            className={`file-row ${selectedIds.includes(file._id) ? 'selected' : ''}`}
            onContextMenu={e => handleContextMenu(e, file)}
            onClick={() => onSelect?.(file._id)}
          >
            <div className="file-row-icon">{getFileIcon(file.mimetype)}</div>
            <div className="file-row-name">
              {file.isStarred && <span style={{ marginRight: 5 }}>⭐</span>}
              {file.originalName}
            </div>
            <div className="file-row-size">{formatBytes(file.size)}</div>
            <div className="file-row-date">{formatDate(file.updatedAt || file.createdAt)}</div>
            <div className="file-row-actions">
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="file-card-btn" onClick={e => handleShare(file, e)} title="Share">🔗</button>
                <button className="file-card-btn" onClick={e => handleDownload(file, e)} title="Download">⬇️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {ctxMenu && (
        <ContextMenu {...ctxMenu} onClose={() => setCtxMenu(null)} onRefresh={onRefresh} />
      )}
      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} />}
    </>
  );

  return (
    <>
      <div className="files-grid">
        {files.map(file => (
          <div
            key={file._id}
            className={`file-card ${selectedIds.includes(file._id) ? 'selected' : ''}`}
            onContextMenu={e => handleContextMenu(e, file)}
            onClick={() => onSelect?.(file._id)}
          >
            {file.mimetype?.startsWith('image/') ? (
              <img
                src={`/uploads/${file.storedName}`}
                alt={file.originalName}
                className="file-card-preview"
                onError={e => { e.target.style.display='none'; }}
              />
            ) : (
              <span className="file-card-icon">{getFileIcon(file.mimetype)}</span>
            )}
            <div className="file-card-name">
              {file.isStarred && <span style={{ marginRight: 4 }}>⭐</span>}
              {file.originalName}
            </div>
            <div className="file-card-meta">{formatBytes(file.size)}</div>
            <div className="file-card-actions">
              <button className={`file-card-btn ${file.isStarred ? 'starred' : ''}`} onClick={e => handleStar(file, e)} title="Star">
                {file.isStarred ? '⭐' : '☆'}
              </button>
              <button className="file-card-btn" onClick={e => handleShare(file, e)} title="Share">🔗</button>
              <button className="file-card-btn" onClick={e => handleDownload(file, e)} title="Download">⬇️</button>
            </div>
          </div>
        ))}
      </div>
      {ctxMenu && (
        <ContextMenu {...ctxMenu} onClose={() => setCtxMenu(null)} onRefresh={onRefresh} />
      )}
      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} />}
    </>
  );
}
