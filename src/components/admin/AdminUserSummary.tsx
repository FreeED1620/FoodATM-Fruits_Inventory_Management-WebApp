import React, { useEffect, useState, useMemo } from "react";
import {
  InventoryService,
  UserSessionSummary,
} from "../../services/inventoryService";
import { isSupabaseConfigured, supabase } from "../../services/supabaseClient";
import { FruitImage } from "../common/FruitImage";
import { InventoryItem, InventoryLog } from "../../types/inventory";
import {
  RefreshCw,
  Clock,
  Package,
  Activity,
  Calendar,
  ShoppingCart,
  Share2,
  ArrowLeftRight,
  Trash2,
} from "lucide-react";

async function loadUsers(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return ["User-1", "User-2", "User-3", "User-4"];
  const { data } = await supabase
    .from('users')
    .select('user_name')
    .order('user_name');
  if (data) {
    const users = data
      .map((u: { user_name: string }) => u.user_name)
      .filter((name: string) => name.toLowerCase() !== 'admin');
    return [...users, 'Admin'];
  }
  return ["User-1", "User-2", "User-3", "User-4"];
}

function getTodayYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const AdminUserSummary: React.FC = () => {
  const [allSummaries, setAllSummaries] = useState<UserSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayYYYYMMDD());
  const [activeTab, setActiveTab] = useState<"items" | "logs" | "sessions">(
    "items",
  );

  useEffect(() => {
    loadUsers().then(users => {
      setAvailableUsers(users);
      if (users.length > 0) setSelectedUser(users[0]);
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await InventoryService.getUserActivityData();
      setAllSummaries(data);
    } catch (err: any) {
      setError(err.message || "Failed to load user activity summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter summaries by selectedUser & selectedDate
  const userDailySessions = useMemo(() => {
    return allSummaries.filter((s) => {
      if (s.userName !== selectedUser) return false;
      const sessionDate = s.startedAt.split("T")[0];
      return sessionDate === selectedDate;
    });
  }, [allSummaries, selectedUser, selectedDate]);

  // Aggregate items added on this date for this user
  const userDailyItems = useMemo(() => {
    const itemsMap = new Map<string, InventoryItem>();
    userDailySessions.forEach((sess) => {
      sess.itemsAdded.forEach((item) => {
        itemsMap.set(item.id, item);
      });
    });
    return Array.from(itemsMap.values()).sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  }, [userDailySessions]);

  // Aggregate logs committed on this date for this user
  const userDailyLogs = useMemo(() => {
    const logsMap = new Map<string, InventoryLog>();
    userDailySessions.forEach((sess) => {
      sess.logsCommitted.forEach((log) => {
        logsMap.set(log.id, log);
      });
    });
    return Array.from(logsMap.values()).sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  }, [userDailySessions]);

  // Compute daily timeframe summary (start of first session -> finish of last session)
  const timeFrameSummary = useMemo(() => {
    if (userDailySessions.length === 0) return null;

    // Sort by startedAt ascending
    const sorted = [...userDailySessions].sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

    const firstStart = sorted[0].startedAt;
    const hasActiveSession = sorted.some((s) => !s.endedAt);

    // Latest ended session time or null if active
    let latestEnd: string | null = null;
    if (!hasActiveSession) {
      const endedTimes = sorted
        .map((s) => s.endedAt!)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      latestEnd = endedTimes[0] || null;
    }

    // Total duration active (sum of session durations)
    let totalMs = 0;
    sorted.forEach((s) => {
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
      const [y, m, d] = dateStr.split("-");
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const totalQtyAdded = userDailyItems.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  );

  // Breakdown of transactions by action type
  const sellCount = userDailyLogs.filter((l) => l.action === "SELL").length;
  const distributeCount = userDailyLogs.filter(
    (l) => l.action === "DISTRIBUTE",
  ).length;
  const transferCount = userDailyLogs.filter(
    (l) => l.action === "TRANSFER",
  ).length;
  const disposeCount = userDailyLogs.filter(
    (l) => l.action === "DISPOSE",
  ).length;

  return (
    <div className="admin-page">
      {/* ══════════════════════════════════════
          BANNER HEADER — gradient panel with
          controls + profile fused together
          ══════════════════════════════════════ */}
      <div className="uab-banner">
        {/* Top row inside banner: title left, refresh right */}
        <div className="uab-banner-toprow">
          <div className="uab-banner-title-group">
            <h1 className="uab-banner-title">User Activity</h1>
            <span className="uab-banner-sub">
              Daily report · {formatDisplayDate(selectedDate)}
            </span>
          </div>
          <button className="uab-refresh-btn" onClick={fetchData} type="button">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Bottom row inside banner: controls + live info side by side */}
        <div className="uab-banner-body">
          {/* Controls cluster */}
          <div className="uab-controls">
            <div className="uab-ctrl-item">
              <span className="uab-ctrl-label">Viewing</span>
              <select
                className="uab-select"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                {availableUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="uab-ctrl-item">
              <span className="uab-ctrl-label">Date</span>
              <div
                className="uab-datepicker-wrap"
                onClick={(e) => {
                  const inp = e.currentTarget.querySelector(
                    'input[type="date"]',
                  ) as HTMLInputElement;
                  if (inp && typeof inp.showPicker === "function")
                    inp.showPicker();
                }}
              >
                <Calendar size={14} />
                <input
                  type="date"
                  className="uab-date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof e.currentTarget.showPicker === "function")
                      e.currentTarget.showPicker();
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className={`uab-today-btn ${selectedDate === getTodayYYYYMMDD() ? "uab-today-active" : ""}`}
              onClick={() => setSelectedDate(getTodayYYYYMMDD())}
            >
              Today
            </button>
          </div>

          {/* Live identity + timeframe (only when data exists) */}
          {loading ? (
            <div className="uab-inline-loading">
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="uab-inline-error">{error}</div>
          ) : timeFrameSummary ? (
            <div className="uab-live-info">
              <div className="uab-identity">
                <div className="uab-avatar">
                  {selectedUser.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="uab-user-name">{selectedUser}</div>
                  <div className="uab-session-line">
                    {timeFrameSummary.sessionCount} session
                    {timeFrameSummary.sessionCount !== 1 ? "s" : ""}
                    {timeFrameSummary.hasActiveSession && (
                      <span className="uab-live-dot" title="Active Now">
                        ●
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="uab-time-segments">
                <div className="uab-time-seg">
                  <span className="uab-tseg-lbl">Start</span>
                  <span className="uab-tseg-val">
                    {formatTimeOnly(timeFrameSummary.firstStart)}
                  </span>
                </div>
                <span className="uab-tseg-arrow">→</span>
                <div className="uab-time-seg">
                  <span className="uab-tseg-lbl">Finish</span>
                  <span className="uab-tseg-val">
                    {timeFrameSummary.hasActiveSession ? (
                      <span className="uab-in-progress">In Progress</span>
                    ) : timeFrameSummary.latestEnd ? (
                      formatTimeOnly(timeFrameSummary.latestEnd)
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="uab-time-seg uab-duration-seg">
                  <span className="uab-tseg-lbl">Total</span>
                  <span className="uab-tseg-val uab-duration-val">
                    {timeFrameSummary.totalDurationStr}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="uab-no-data-hint">
              <span>
                No activity found for <strong>{selectedUser}</strong> on this
                date
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Only render metrics + tabs when we have data */}
      {!loading && !error && timeFrameSummary && (
        <>
          {/* ── Segmented Stat Bar ── */}
          <div className="uab-stat-bar">
            <div className="uab-stat-seg uab-stat-items">
              <Package size={16} className="uab-stat-icon" />
              <div className="uab-stat-info">
                <span className="uab-stat-num">{userDailyItems.length}</span>
                <span className="uab-stat-lbl">
                  Items · {totalQtyAdded} boxes
                </span>
              </div>
            </div>
            <div className="uab-stat-divider" />
            <div className="uab-stat-seg uab-stat-sell">
              <ShoppingCart size={16} className="uab-stat-icon" />
              <div className="uab-stat-info">
                <span className="uab-stat-num">{sellCount}</span>
                <span className="uab-stat-lbl">Sells</span>
              </div>
            </div>
            <div className="uab-stat-divider" />
            <div className="uab-stat-seg uab-stat-dist">
              <Share2 size={16} className="uab-stat-icon" />
              <div className="uab-stat-info">
                <span className="uab-stat-num">{distributeCount}</span>
                <span className="uab-stat-lbl">Distributes</span>
              </div>
            </div>
            <div className="uab-stat-divider" />
            <div className="uab-stat-seg uab-stat-transfer">
              <ArrowLeftRight size={16} className="uab-stat-icon" />
              <div className="uab-stat-info">
                <span className="uab-stat-num">{transferCount}</span>
                <span className="uab-stat-lbl">Transfers</span>
              </div>
            </div>
            <div className="uab-stat-divider" />
            <div className="uab-stat-seg uab-stat-dispose">
              <Trash2 size={16} className="uab-stat-icon" />
              <div className="uab-stat-info">
                <span className="uab-stat-num">{disposeCount}</span>
                <span className="uab-stat-lbl">Disposed</span>
              </div>
            </div>
          </div>

          {/* ── Data Tabs ── */}
          <div className="uab-content-area">
            {/* Tab switcher */}
            <div className="uab-tab-row">
              <button
                className={`uab-tabBtn ${activeTab === "items" ? "uab-tabBtn--active" : ""}`}
                onClick={() => setActiveTab("items")}
                type="button"
              >
                <Package size={14} />
                Items Added
                <span className="uab-tabBtn-badge">
                  {userDailyItems.length}
                </span>
              </button>
              <button
                className={`uab-tabBtn ${activeTab === "logs" ? "uab-tabBtn--active" : ""}`}
                onClick={() => setActiveTab("logs")}
                type="button"
              >
                <Activity size={14} />
                Transactions
                <span className="uab-tabBtn-badge">{userDailyLogs.length}</span>
              </button>
              <button
                className={`uab-tabBtn ${activeTab === "sessions" ? "uab-tabBtn--active" : ""}`}
                onClick={() => setActiveTab("sessions")}
                type="button"
              >
                <Clock size={14} />
                Sessions
                <span className="uab-tabBtn-badge">
                  {userDailySessions.length}
                </span>
              </button>
            </div>

            {/* Tab content */}
            <div className="uab-tab-content">
              {/* Items */}
              {activeTab === "items" &&
                (userDailyItems.length === 0 ? (
                  <p className="tab-empty-text">
                    No items added by {selectedUser} on{" "}
                    {formatDisplayDate(selectedDate)}.
                  </p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Inventory ID</th>
                          <th>Item</th>
                          <th>Initial Qty</th>
                          <th>Quantity</th>
                          <th>Batch</th>
                          <th>Received</th>
                          <th>Expiry</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDailyItems.map((item) => (
                          <tr key={item.id}>
                            <td className="admin-table-id">
                              {item.inventoryId}
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <FruitImage
                                  fruitName={item.fruitName}
                                  size={28}
                                />
                                <strong>{item.fruitName}</strong>
                              </div>
                            </td>
                            <td>
                              <strong>{item.originalQuantity}</strong> {item.unit}
                            </td>
                            <td>
                              <strong>{item.quantity}</strong> {item.unit}
                            </td>
                            <td>Batch {item.batchNumber}</td>
                            <td>{item.receivedDate}</td>
                            <td>{item.expiryDate}</td>
                            <td>
                              <span
                                className={`admin-badge badge-${item.status.toLowerCase()}`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {/* Logs */}
              {activeTab === "logs" &&
                (userDailyLogs.length === 0 ? (
                  <p className="tab-empty-text">
                    No transactions committed by {selectedUser} on{" "}
                    {formatDisplayDate(selectedDate)}.
                  </p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Action</th>
                          <th>Inventory ID</th>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Recipient</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userDailyLogs.map((log) => (
                          <tr
                            key={log.id}
                            className={log.reversed ? "row-reversed" : ""}
                          >
                            <td>{formatDateTime(log.createdAt)}</td>
                            <td>
                              <span
                                className={`action-badge action-${log.action.toLowerCase()}`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="admin-table-id">
                              {log.inventoryId}
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <FruitImage
                                  fruitName={log.fruitName || ""}
                                  size={24}
                                />
                                <span>{log.fruitName}</span>
                              </div>
                            </td>
                            <td>
                              <strong>{log.quantity}</strong> boxes
                            </td>
                            <td>{log.recipient || "—"}</td>
                            <td>
                              {log.reversed ? (
                                <span className="admin-badge badge-ended">
                                  Undone
                                </span>
                              ) : (
                                <span className="admin-badge badge-active">
                                  Committed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

              {/* Sessions */}
              {activeTab === "sessions" && (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Started At</th>
                        <th>Ended At</th>
                        <th>Duration</th>
                        <th>Items</th>
                        <th>Transactions</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDailySessions.map((sess, idx) => {
                        const startMs = new Date(sess.startedAt).getTime();
                        const endMs = sess.endedAt
                          ? new Date(sess.endedAt).getTime()
                          : Date.now();
                        const diffMins = Math.floor(
                          Math.max(0, endMs - startMs) / 60000,
                        );
                        const durStr =
                          diffMins >= 60
                            ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
                            : `${diffMins}m`;
                        return (
                          <tr key={sess.sessionId}>
                            <td className="admin-table-id">
                              #{sess.sessionNumber || idx + 1}
                            </td>
                            <td>{formatDateTime(sess.startedAt)}</td>
                            <td>
                              {sess.endedAt
                                ? formatDateTime(sess.endedAt)
                                : "—"}
                            </td>
                            <td>
                              <strong>{durStr}</strong>
                            </td>
                            <td>{sess.itemsAdded.length} items</td>
                            <td>{sess.logsCommitted.length} txs</td>
                            <td>
                              <span
                                className={`admin-badge ${sess.endedAt ? "badge-ended" : "badge-active"}`}
                              >
                                {sess.endedAt ? "Ended" : "Active"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
