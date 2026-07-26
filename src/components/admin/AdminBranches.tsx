import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../services/supabaseClient';
import { ConfirmModal } from '../common/ConfirmModal';

interface Branch {
  id: string;
  name: string;
  created_at: string;
}

export const AdminBranches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase
      .from('foodatmbranches')
      .select('*')
      .order('name');
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setBranches(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Enter a branch name');
      return;
    }
    if (branches.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Branch already exists');
      return;
    }
    if (!isSupabaseConfigured || !supabase) return;
    setAdding(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from('foodatmbranches')
      .insert([{ name: trimmed }])
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
    } else {
      setBranches(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !isSupabaseConfigured || !supabase) return;
    const { error: deleteError } = await supabase
      .from('foodatmbranches')
      .delete()
      .eq('id', deleteTarget.id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setBranches(prev => prev.filter(b => b.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-row">
        <div>
          <h1 className="admin-page-title">Branches</h1>
          <p className="admin-page-desc">Manage warehouse branch locations.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchBranches} type="button">
          Refresh
        </button>
      </div>

      <div className="admin-add-row">
        <input
          type="text"
          className="form-input"
          placeholder="New branch name"
          value={newName}
          onChange={e => { setNewName(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          maxLength={50}
        />
        <button className="btn btn-primary" onClick={handleAdd} disabled={adding} type="button">
          <Plus size={18} />
          <span>{adding ? 'Adding...' : 'Add'}</span>
        </button>
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
      ) : branches.length === 0 ? (
        <p className="admin-empty-text" style={{ marginTop: '1rem' }}>No branches added yet.</p>
      ) : (
        <div className="admin-users-list" style={{ marginTop: '1rem' }}>
          {branches.map(branch => (
            <div key={branch.id} className="admin-user-row">
              <span className="admin-user-avatar">
                <MapPin size={16} />
              </span>
              <span className="admin-user-name">{branch.name}</span>
              <div className="admin-user-actions">
                <button
                  className="admin-icon-btn danger"
                  onClick={() => setDeleteTarget(branch)}
                  type="button"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Branch?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        danger
      />
    </div>
  );
};
