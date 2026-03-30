import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/auth/profile', { name });
      setIsEditing(false);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="profile-container">
          {/* Avatar */}
          <div className="profile-avatar">
            <div className="profile-avatar-circle">
              {user.name?.[0]?.toUpperCase()}
            </div>
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            {isEditing ? (
              <div className="profile-field">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="profile-input"
                  placeholder="Enter your name"
                  autoFocus
                />
              </div>
            ) : (
              <div className="profile-field">
                <label>Name</label>
                <p className="profile-value">{user.name}</p>
              </div>
            )}

            <div className="profile-field">
              <label>Email</label>
              <p className="profile-value">{user.email}</p>
            </div>

            {user.createdAt && (
              <div className="profile-field">
                <label>Member Since</label>
                <p className="profile-value">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="profile-actions">
            {isEditing ? (
              <>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    setName(user.name);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
