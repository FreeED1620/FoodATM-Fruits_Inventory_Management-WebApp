import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../services/supabaseClient';

interface SessionRecord {
  id: string;
  user_name: string;
  session_number: number;
  started_at: string;
  ended_at: string | null;
}

export const AdminSessions: React.FC = () => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatDuration = (started: string, ended: string | null) => {
    const start = new Date(started);
    const end = ended ? new Date(ended) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header-row">
        <div>
          <h1 className="admin-page-title">Session History</h1>
          <p className="admin-page-desc">All login sessions across the application.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSessions} type="button">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="admin-error-msg">{error}</div>
      ) : sessions.length === 0 ? (
        <p className="admin-empty-text">No sessions recorded yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, idx) => (
                <tr key={s.id}>
                  <td className="admin-table-id">{s.session_number || idx + 1}</td>
                  <td>{s.user_name}</td>
                  <td>{new Date(s.started_at).toLocaleString()}</td>
                  <td>{s.ended_at ? new Date(s.ended_at).toLocaleString() : '—'}</td>
                  <td>{formatDuration(s.started_at, s.ended_at)}</td>
                  <td>
                    <span className={`admin-badge ${s.ended_at ? 'badge-ended' : 'badge-active'}`}>
                      {s.ended_at ? 'Ended' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
