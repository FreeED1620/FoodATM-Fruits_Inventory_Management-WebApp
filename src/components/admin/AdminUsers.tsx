import React, { useState } from 'react';
import { UserPlus, Edit3, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

const STORAGE_KEY = 'foodatm_admin_users';

const DEFAULT_USERS = ['User-1', 'User-2', 'User-3', 'User-4'];

function loadUsers(): string[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [...DEFAULT_USERS];
    }
  }
  return [...DEFAULT_USERS];
}

function saveUsers(users: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<string[]>(loadUsers);
  const [newUser, setNewUser] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  const handleAdd = () => {
    const trimmed = newUser.trim();
    if (!trimmed) {
      setError('Enter a user name');
      return;
    }
    if (users.includes(trimmed)) {
      setError('User already exists');
      return;
    }
    if (trimmed.toLowerCase() === 'admin') {
      setError('Cannot add a user named Admin');
      return;
    }
    const updated = [...users, trimmed];
    setUsers(updated);
    saveUsers(updated);
    setNewUser('');
    setError(null);
  };

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(users[idx]);
    setError(null);
  };

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setError('User name cannot be empty');
      return;
    }
    if (trimmed.toLowerCase() === 'admin') {
      setError('Cannot rename to Admin');
      return;
    }
    if (users.some((u, i) => i !== editingIdx && u === trimmed)) {
      setError('User already exists');
      return;
    }
    const updated = [...users];
    updated[editingIdx!] = trimmed;
    setUsers(updated);
    saveUsers(updated);
    setEditingIdx(null);
    setEditValue('');
    setError(null);
  };

  const handleDelete = () => {
    if (deleteIdx === null) return;
    const updated = users.filter((_, i) => i !== deleteIdx);
    setUsers(updated);
    saveUsers(updated);
    setDeleteIdx(null);
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Manage Users</h1>
      <p className="admin-page-desc">Add, edit, or remove users from the session picker. Admin is always available.</p>

      <div className="admin-add-row">
        <input
          type="text"
          className="form-input"
          placeholder="New user name"
          value={newUser}
          onChange={e => { setNewUser(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          maxLength={20}
        />
        <button className="btn btn-primary" onClick={handleAdd} type="button">
          <UserPlus size={18} />
          <span>Add</span>
        </button>
      </div>

      {error && (
        <div className="form-error" style={{ marginTop: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div className="admin-users-list">
        {users.map((user, idx) => (
          <div key={`${user}-${idx}`} className="admin-user-row">
            {editingIdx === idx ? (
              <>
                <input
                  type="text"
                  className="form-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                  autoFocus
                  maxLength={20}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleSaveEdit} type="button" style={{ padding: '0.4rem 0.8rem' }}>
                  Save
                </button>
                <button className="btn btn-secondary" onClick={() => setEditingIdx(null)} type="button" style={{ padding: '0.4rem 0.8rem' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="admin-user-avatar">{user.charAt(0).toUpperCase()}</span>
                <span className="admin-user-name">{user}</span>
                <div className="admin-user-actions">
                  <button className="admin-icon-btn" onClick={() => handleEdit(idx)} type="button" title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button className="admin-icon-btn danger" onClick={() => setDeleteIdx(idx)} type="button" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteIdx !== null}
        onClose={() => setDeleteIdx(null)}
        onConfirm={handleDelete}
        title="Delete User?"
        message={`Are you sure you want to remove "${deleteIdx !== null ? users[deleteIdx] : ''}" from the user list?`}
        confirmText="Delete"
        danger
      />
    </div>
  );
};
