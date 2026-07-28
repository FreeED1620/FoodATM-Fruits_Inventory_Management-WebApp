import React, { useState, useEffect } from 'react';
import { UserPlus, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../services/supabaseClient';
import { ConfirmModal } from '../common/ConfirmModal';

interface UserRecord {
  id: string;
  user_name: string;
  password: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [newUser, setNewUser] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('user_name');
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async () => {
    const trimmed = newUser.trim();
    if (!trimmed) {
      setError('Enter a user name');
      return;
    }
    if (!newPassword.trim()) {
      setError('Enter a password');
      return;
    }
    if (users.some(u => u.user_name === trimmed)) {
      setError('User already exists');
      return;
    }
    if (trimmed.toLowerCase() === 'admin') {
      setError('Cannot add a user named Admin');
      return;
    }
    if (!isSupabaseConfigured || !supabase) return;
    const { data, error: insertError } = await supabase
      .from('users')
      .insert([{ user_name: trimmed, password: newPassword }])
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
    } else {
      setUsers(prev => [...prev, data].sort((a, b) => a.user_name.localeCompare(b.user_name)));
      setNewUser('');
      setNewPassword('');
      setError(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      setError('User name cannot be empty');
      return;
    }
    if (trimmed.toLowerCase() === 'admin') {
      setError('Cannot rename to Admin');
      return;
    }
    if (users.some(u => u.id !== editingId && u.user_name === trimmed)) {
      setError('User already exists');
      return;
    }
    if (!isSupabaseConfigured || !supabase) return;
    const updateData: { user_name: string; password?: string } = { user_name: trimmed };
    if (editPassword.trim()) {
      updateData.password = editPassword;
    }
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', editingId);
    if (updateError) {
      setError(updateError.message);
    } else {
      setUsers(prev => prev.map(u => u.id === editingId ? { ...u, user_name: trimmed, ...(editPassword.trim() ? { password: editPassword } : {}) } : u).sort((a, b) => a.user_name.localeCompare(b.user_name)));
      setEditingId(null);
      setEditValue('');
      setEditPassword('');
      setError(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !isSupabaseConfigured || !supabase) return;
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', deleteId);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setUsers(prev => prev.filter(u => u.id !== deleteId));
      setDeleteId(null);
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Manage Users</h1>
      <p className="admin-page-desc">Add, edit, or remove users from the session picker. Admin is always available.</p>

      <div className="admin-add-row" style={{ flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="New user name"
            value={newUser}
            onChange={e => { setNewUser(e.target.value); setError(null); }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            maxLength={20}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleAdd} type="button">
            <UserPlus size={18} />
            <span>Add</span>
          </button>
        </div>
        <div className="admin-password-field" style={{ width: '100%' }}>
          <input
            type={showNewPassword ? 'text' : 'password'}
            className="form-input"
            placeholder="Password"
            value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setError(null); }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button className="admin-eye-btn" onClick={() => setShowNewPassword(!showNewPassword)} type="button">
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error" style={{ marginTop: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading" style={{ marginTop: '1rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="admin-users-list">
          {users.map(user => (
            <div key={user.id} className="admin-user-row">
              {editingId === user.id ? (
                <>
                  <input
                    type="text"
                    className="form-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    autoFocus
                    maxLength={20}
                    style={{ flex: 1 }}
                  />
                  <div className="admin-password-field" style={{ flex: 1 }}>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="New password (leave empty to keep)"
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    />
                    <button className="admin-eye-btn" onClick={() => setShowEditPassword(!showEditPassword)} type="button">
                      {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveEdit} type="button" style={{ padding: '0.4rem 0.8rem' }}>
                    Save
                  </button>
                  <button className="btn btn-secondary" onClick={() => setEditingId(null)} type="button" style={{ padding: '0.4rem 0.8rem' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="admin-user-avatar">{user.user_name.charAt(0).toUpperCase()}</span>
                  <span className="admin-user-name">{user.user_name}</span>
                  <div className="admin-user-actions">
                    <button className="admin-icon-btn" onClick={() => { setEditingId(user.id); setEditValue(user.user_name); setError(null); }} type="button" title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button className="admin-icon-btn danger" onClick={() => setDeleteId(user.id)} type="button" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User?"
        message={`Are you sure you want to remove "${deleteId !== null ? users.find(u => u.id === deleteId)?.user_name : ''}" from the user list?`}
        confirmText="Delete"
        danger
      />
    </div>
  );
};
