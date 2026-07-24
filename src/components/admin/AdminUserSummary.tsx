import React, { useEffect, useState, useMemo } from 'react';
import { InventoryService, UserSessionSummary } from '../../services/inventoryService';
import { FruitImage } from '../common/FruitImage';
import { InventoryItem, InventoryLog } from '../../types/inventory';
import { RefreshCw, Clock, Package, Activity, Calendar, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'foodatm_admin_users';
const DEFAULT_USERS = ['User-1', 'User-2', 'User-3', 'User-4'];

function loadUsers(): string[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const list = JSON.parse(stored);
      return list.filter((u: string) => u.toLowerCase() !== 'admin');
    } catch {
      return [...DEFAULT_USERS];
    }
  }
  return [...DEFAULT_USERS];
}

function getTodayYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AdminUserSummary: React.FC = () => {
  const [allSummaries, setAllSummaries] = useState<UserSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableUsers = useMemo(() => loadUsers(), []);
  const [selectedUser, setSelectedUser] = useState<string>(availableUsers[0] || 'User-1');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayYYYYMMDD());
  const [activeTab, setActiveTab] = useState<'items' | 'logs' | 'sessions'>('items');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await InventoryService.getUserActivityData();
      // Exclude Admin sessions
      const nonAdminData = data.filter(s => s.userName && s.userName.toLowerCase() !== 'admin');
      setAllSummaries(nonAdminData);
    } catch (err: any) {
      setError(err.message || 'Failed to load user activity summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter summaries by selectedUser & selectedDate
  const userDailySessions = useMemo(() => {
    return allSummaries.filter(s => {
      if (s.userName !== selectedUser) return false;
      const sessionDate = s.startedAt.split('T')[0];
      return sessionDate === selectedDate;
    });
  }, [allSummaries, selectedUser, selectedDate]);

  // Aggregate items added on this date for this user
  const userDailyItems = useMemo(() => {
    const itemsMap = new Map<string, InventoryItem>();
    userDailySessions.forEach(sess => {
      sess.itemsAdded.forEach(item => {
        itemsMap.set(item.id, item);
      });
    });
    return Array.from(itemsMap.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [userDailySessions]);

  // Aggregate logs committed on this date for this user
  const userDailyLogs = useMemo(() => {
    const logsMap = new Map<string, InventoryLog>();
    userDailySessions.forEach(sess => {
      sess.logsCommitted.forEach(log => {
        logsMap.set(log.id, log);
      });
    });
    return Array.from(logsMap.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [userDailySessions]);

  // Compute daily timeframe summary (start of first session -> finish of last session)
  const timeFrameSummary = useMemo(() => {
    if (userDailySessions.length === 0) return null;

    // Sort by startedAt ascending
    const sorted = [...userDailySessions].sort((a, b) =>
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

    const firstStart = sorted[0].startedAt;
    const hasActiveSession = sorted.some(s => !s.endedAt);

    // Latest ended session time or null if active
    let latestEnd: string | null = null;
    if (!hasActiveSession) {
      const endedTimes = sorted.map(s => s.endedAt!).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      latestEnd = endedTimes[0] || null;
    }

    // Total duration active (sum of session durations)
    let totalMs = 0;
    sorted.forEach(s => {
      const startMs = new Date(s.startedAt).getTime();
      const endMs = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
      totalMs += Math.max(0, endMs - startMs);
    });

    const mins = Math.floor(totalMs / 60000);
    const hours = Math.floor(mins / 60);
    const durationStr = hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;

    return {
      firstStart,
      latestEnd,
      hasActiveSession,
      totalDurationStr: durationStr,
      sessionCount: sorted.length,
    };
  }, [userDailySessions]);

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const totalQtyAdded = userDailyItems.reduce((acc, curr) => acc + curr.quantity, 0);

  // Breakdown of transactions by action type
  const sellCount = userDailyLogs.filter(l => l.action === 'SELL').length;
  const distributeCount = userDailyLogs.filter(l => l.action === 'DISTRIBUTE').length;
  const transferCount = userDailyLogs.filter(l => l.action === 'TRANSFER').length;

  return (
    <div className="admin-page">
      <div className="admin-page-header-row">
        <div>
          <h1 className="admin-page-title">User Daily Activity Summary</h1>
          <p className="admin-page-desc">
            Select a user and date to view their complete session timeframe, items added, and committed transactions.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} type="button">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        /* Loading: show controls on their own row */
        <div className="user-daily-controls standalone-controls">
          <div className="control-group user-control-group">
            <label className="form-label">Select User</label>
            <select className="form-input user-select-input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              {availableUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="control-group date-control-group">
            <label className="form-label">Choose Date</label>
            <div className="select-wrapper date-picker-wrapper" onClick={(e) => { const inp = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement; if (inp && typeof inp.showPicker === 'function') inp.showPicker(); }}>
              <Calendar size={18} className="select-icon" />
              <input type="date" className="form-input control-input date-input-clickable" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} onClick={e => { e.stopPropagation(); if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker(); }} />
            </div>
          </div>
          <div className="date-quick-btns">
            <button type="button" className={`btn btn-secondary btn-sm ${selectedDate === getTodayYYYYMMDD() ? 'active' : ''}`} onClick={() => setSelectedDate(getTodayYYYYMMDD())}>Today</button>
          </div>
          <div className="admin-loading" style={{ flex: 1 }}><div className="spinner" /></div>
        </div>
      ) : error ? (
        <>
          <div className="user-daily-controls standalone-controls">
            <div className="control-group user-control-group">
              <label className="form-label">Select User</label>
              <select className="form-input user-select-input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                {availableUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="control-group date-control-group">
              <label className="form-label">Choose Date</label>
              <div className="select-wrapper date-picker-wrapper" onClick={(e) => { const inp = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement; if (inp && typeof inp.showPicker === 'function') inp.showPicker(); }}>
                <Calendar size={18} className="select-icon" />
                <input type="date" className="form-input control-input date-input-clickable" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} onClick={e => { e.stopPropagation(); if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker(); }} />
              </div>
            </div>
            <div className="date-quick-btns">
              <button type="button" className={`btn btn-secondary btn-sm ${selectedDate === getTodayYYYYMMDD() ? 'active' : ''}`} onClick={() => setSelectedDate(getTodayYYYYMMDD())}>Today</button>
            </div>
          </div>
          <div className="admin-error-msg">{error}</div>
        </>
      ) : !timeFrameSummary ? (
        /* Empty State: controls + empty notice side by side */
        <div className="daily-top-row">
          <div className="user-daily-controls daily-controls-card">
            <div className="control-group user-control-group">
              <label className="form-label">Select User</label>
              <select className="form-input user-select-input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                {availableUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="control-group date-control-group">
              <label className="form-label">Choose Date</label>
              <div className="select-wrapper date-picker-wrapper" onClick={(e) => { const inp = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement; if (inp && typeof inp.showPicker === 'function') inp.showPicker(); }}>
                <Calendar size={18} className="select-icon" />
                <input type="date" className="form-input control-input date-input-clickable" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} onClick={e => { e.stopPropagation(); if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker(); }} />
              </div>
            </div>
            <div className="date-quick-btns">
              <button type="button" className={`btn btn-secondary btn-sm ${selectedDate === getTodayYYYYMMDD() ? 'active' : ''}`} onClick={() => setSelectedDate(getTodayYYYYMMDD())}>Today</button>
            </div>
          </div>
          <div className="daily-empty-card" style={{ flex: 1 }}>
            <div className="empty-avatar">{selectedUser.charAt(0).toUpperCase()}</div>
            <h3 className="empty-title">No Activity for {selectedUser}</h3>
            <p className="empty-desc">No login sessions or activities recorded for <strong>{selectedUser}</strong> on <strong>{formatDisplayDate(selectedDate)}</strong>.</p>
          </div>
        </div>
      ) : (
        /* Summary Content for Selected User & Date */
        <div className="daily-summary-container">
          {/* Top row: Controls card + Banner card side by side */}
          <div className="daily-top-row">
            {/* Left: User & Date Selection Controls */}
            <div className="user-daily-controls daily-controls-card">
              {/* User Dropdown */}
              <div className="control-group user-control-group">
                <label className="form-label">Select User</label>
                <select
                  className="form-input user-select-input"
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                >
                  {availableUsers.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Date Picker */}
              <div className="control-group date-control-group">
                <label className="form-label">Choose Date</label>
                <div
                  className="select-wrapper date-picker-wrapper"
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                    if (input && typeof input.showPicker === 'function') {
                      input.showPicker();
                    }
                  }}
                >
                  <Calendar size={18} className="select-icon" />
                  <input
                    type="date"
                    className="form-input control-input date-input-clickable"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    onClick={e => {
                      e.stopPropagation();
                      if (typeof e.currentTarget.showPicker === 'function') {
                        e.currentTarget.showPicker();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Quick Date Shortcut */}
              <div className="date-quick-btns">
                <button
                  type="button"
                  className={`btn btn-secondary btn-sm ${selectedDate === getTodayYYYYMMDD() ? 'active' : ''}`}
                  onClick={() => setSelectedDate(getTodayYYYYMMDD())}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Right: User identity + Timeframe banner */}
            <div className="daily-summary-banner">
              {/* User identity card */}
              <div className="daily-user-card">
                <div className="daily-avatar">{selectedUser.charAt(0).toUpperCase()}</div>
                <div>
                  <h2 className="daily-user-name">{selectedUser}</h2>
                  <div className="daily-date-label">
                    <Calendar size={14} />
                    <span>{formatDisplayDate(selectedDate)}</span>
                  </div>
                  <div className="daily-session-count">
                    <strong>{timeFrameSummary.sessionCount}</strong> session(s) today
                  </div>
                </div>
              </div>

              {/* Timeframe box */}
              <div className="daily-timeframe-box">
                <div className="timeframe-title">
                  <Clock size={16} className="time-icon" />
                  <span>Work Timeframe (Start → Finish)</span>
                  {timeFrameSummary.hasActiveSession && (
                    <span className="admin-badge badge-active" style={{ marginLeft: 'auto' }}>Active Now</span>
                  )}
                </div>

                <div className="timeframe-row">
                  <div className="time-block">
                    <span className="time-label">FIRST START</span>
                    <span className="time-val">{formatTimeOnly(timeFrameSummary.firstStart)}</span>
                  </div>

                  <ArrowRight size={20} className="time-arrow" />

                  <div className="time-block">
                    <span className="time-label">LATEST FINISH</span>
                    <span className="time-val">
                      {timeFrameSummary.hasActiveSession
                        ? 'In Progress'
                        : timeFrameSummary.latestEnd
                        ? formatTimeOnly(timeFrameSummary.latestEnd)
                        : '—'}
                    </span>
                  </div>

                  <div className="time-block duration-block">
                    <span className="time-label">TOTAL WORK TIME</span>
                    <span className="duration-highlight">{timeFrameSummary.totalDurationStr}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Counters Grid */}
          <div className="daily-stats-grid">
            <div className="daily-stat-card">
              <div className="stat-icon-wrap items-icon">
                <Package size={20} />
              </div>
              <div>
                <div className="stat-val">{userDailyItems.length}</div>
                <div className="stat-lbl">Items Added ({totalQtyAdded} boxes)</div>
              </div>
            </div>

            <div className="daily-stat-card">
              <div className="stat-icon-wrap tx-icon">
                <Activity size={20} />
              </div>
              <div>
                <div className="stat-val">{userDailyLogs.length}</div>
                <div className="stat-lbl">Total Transactions</div>
              </div>
            </div>

            <div className="daily-stat-card">
              <div className="stat-breakdown">
                <span className="action-badge action-sell">SELL: {sellCount}</span>
                <span className="action-badge action-distribute">DISTRIBUTE: {distributeCount}</span>
                <span className="action-badge action-transfer">TRANSFER: {transferCount}</span>
              </div>
              <div className="stat-lbl" style={{ marginTop: '4px' }}>Transaction Breakdown</div>
            </div>
          </div>

          {/* Main Activity Detail Tabs */}
          <div className="daily-tabs-container">
            <div className="user-summary-tabs">
              <button
                className={`user-summary-tab ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
                type="button"
              >
                <Package size={16} />
                <span>Items Added ({userDailyItems.length})</span>
              </button>

              <button
                className={`user-summary-tab ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
                type="button"
              >
                <Activity size={16} />
                <span>Transactions Committed ({userDailyLogs.length})</span>
              </button>

              <button
                className={`user-summary-tab ${activeTab === 'sessions' ? 'active' : ''}`}
                onClick={() => setActiveTab('sessions')}
                type="button"
              >
                <Clock size={16} />
                <span>Sessions ({userDailySessions.length})</span>
              </button>
            </div>

            {/* Tab Pane 1: Items Added */}
            {activeTab === 'items' && (
              <div className="user-summary-tab-pane">
                {userDailyItems.length === 0 ? (
                  <p className="tab-empty-text">No items were added by {selectedUser} on {formatDisplayDate(selectedDate)}.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Inventory ID</th>
                          <th>Fruit</th>
                          <th>Quantity</th>
                          <th>Batch</th>
                          <th>Received Date</th>
                          <th>Expiry Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDailyItems.map(item => (
                          <tr key={item.id}>
                            <td className="admin-table-id">{item.inventoryId}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FruitImage fruitName={item.fruitName} size={28} />
                                <strong>{item.fruitName}</strong>
                              </div>
                            </td>
                            <td><strong>{item.quantity}</strong> {item.unit}</td>
                            <td>Batch {item.batchNumber}</td>
                            <td>{item.receivedDate}</td>
                            <td>{item.expiryDate}</td>
                            <td>
                              <span className={`admin-badge badge-${item.status.toLowerCase()}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab Pane 2: Transactions Committed */}
            {activeTab === 'logs' && (
              <div className="user-summary-tab-pane">
                {userDailyLogs.length === 0 ? (
                  <p className="tab-empty-text">No transactions were committed by {selectedUser} on {formatDisplayDate(selectedDate)}.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Action</th>
                          <th>Inventory ID</th>
                          <th>Fruit</th>
                          <th>Qty Affected</th>
                          <th>Destination / Recipient</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDailyLogs.map(log => (
                          <tr key={log.id} className={log.reversed ? 'row-reversed' : ''}>
                            <td>{formatDateTime(log.createdAt)}</td>
                            <td>
                              <span className={`action-badge action-${log.action.toLowerCase()}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="admin-table-id">{log.inventoryId}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FruitImage fruitName={log.fruitName || ''} size={24} />
                                <span>{log.fruitName}</span>
                              </div>
                            </td>
                            <td><strong>{log.quantity}</strong> boxes</td>
                            <td>{log.recipient || '—'}</td>
                            <td>
                              {log.reversed ? (
                                <span className="admin-badge badge-ended">Undone</span>
                              ) : (
                                <span className="admin-badge badge-active">Committed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab Pane 3: Sessions List */}
            {activeTab === 'sessions' && (
              <div className="user-summary-tab-pane">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Started At</th>
                        <th>Ended At</th>
                        <th>Duration</th>
                        <th>Items Added</th>
                        <th>Transactions</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDailySessions.map((sess, idx) => {
                        const startMs = new Date(sess.startedAt).getTime();
                        const endMs = sess.endedAt ? new Date(sess.endedAt).getTime() : Date.now();
                        const diffMins = Math.floor(Math.max(0, endMs - startMs) / 60000);
                        const durStr = diffMins >= 60 ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` : `${diffMins}m`;

                        return (
                          <tr key={sess.sessionId}>
                            <td className="admin-table-id">#{sess.sessionNumber || idx + 1}</td>
                            <td>{formatDateTime(sess.startedAt)}</td>
                            <td>{sess.endedAt ? formatDateTime(sess.endedAt) : '—'}</td>
                            <td><strong>{durStr}</strong></td>
                            <td>{sess.itemsAdded.length} items</td>
                            <td>{sess.logsCommitted.length} txs</td>
                            <td>
                              <span className={`admin-badge ${sess.endedAt ? 'badge-ended' : 'badge-active'}`}>
                                {sess.endedAt ? 'Ended' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
