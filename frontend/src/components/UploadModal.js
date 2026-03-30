import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatBytes } from '../utils/format';

export default function UploadModal({ onClose, onSuccess, currentFolder = '/' }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const onDrop = useCallback((accepted) => {
    setFiles(prev => [...prev, ...accepted.map(f => ({ file: f, id: Math.random().toString(36).slice(2) }))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 500 * 1024 * 1024
  });

  const removeFile = (id) => setFiles(f => f.filter(x => x.id !== id));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);

    const formData = new FormData();
    files.forEach(({ file }) => formData.append('files', file));
    formData.append('folder', currentFolder);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress({ all: pct });
        }
      });
      toast.success(`${files.length} file(s) uploaded successfully!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Upload Files</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}>
          <input {...getInputProps()} />
          <span className="upload-zone-icon">☁️</span>
          <h3>{isDragActive ? 'Drop files here' : 'Drag & drop files'}</h3>
          <p>or click to browse · max 500 MB per file</p>
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: 14, maxHeight: 200, overflowY: 'auto' }}>
            {files.map(({ file, id }) => (
              <div key={id} className="upload-item">
                <span style={{ fontSize: '1.1rem' }}>📄</span>
                <div className="upload-item-name">{file.name}</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--mono)', flexShrink: 0 }}>
                  {formatBytes(file.size)}
                </span>
                {!uploading && (
                  <button onClick={() => removeFile(id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2 }}>✕</button>
                )}
              </div>
            ))}
            {uploading && progress.all !== undefined && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 4 }}>
                  <span>Uploading...</span>
                  <span style={{ fontFamily: 'var(--mono)' }}>{progress.all}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress.all}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!files.length || uploading}>
            {uploading
              ? <><span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> Uploading</>
              : `Upload ${files.length ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
