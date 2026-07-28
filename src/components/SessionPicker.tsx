import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";
import { LogIn, Shield } from "lucide-react";

export const SessionPicker: React.FC = () => {
  const { startSession } = useSession();
  const navigate = useNavigate();
  const [users, setUsers] = useState<string[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordError, setUserPasswordError] = useState<string | null>(null);
  const [userPasswordLoading, setUserPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setUsersLoading(false);
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("user_name")
        .order("user_name");
      setUsers(data?.map((u) => u.user_name) || []);
      setUsersLoading(false);
    };
    fetchUsers();
  }, []);

  const checkActiveSession = async (userName: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) return false;
    const { data } = await supabase
      .from("sessions")
      .select("id")
      .eq("user_name", userName)
      .is("ended_at", null)
      .limit(1);
    return !!(data && data.length > 0);
  };

  const handleUserLogin = async () => {
    if (!selectedUser) return;
    if (!userPassword.trim()) {
      setUserPasswordError("Enter your password");
      return;
    }
    setUserPasswordLoading(true);
    setUserPasswordError(null);

    if (!isSupabaseConfigured || !supabase) {
      setUserPasswordError("Supabase is not configured");
      setUserPasswordLoading(false);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("password")
      .eq("user_name", selectedUser)
      .single();

    if (!data || !data.password) {
      setUserPasswordError("No password set. Contact admin.");
      setUserPasswordLoading(false);
      return;
    }

    if (userPassword !== data.password) {
      setUserPasswordError("Incorrect password");
      setUserPasswordLoading(false);
      return;
    }

    setStarting(true);
    try {
      const isActive = await checkActiveSession(selectedUser);
      if (isActive) {
        setError("This user is already active on another device.");
        setStarting(false);
        setUserPasswordLoading(false);
        return;
      }
      await startSession(selectedUser);
    } catch (err: any) {
      setError(err.message || "Failed to start session");
      setStarting(false);
      setUserPasswordLoading(false);
    }
  };

  const handleSelectUser = (user: string) => {
    setSelectedUser(user);
    setError(null);
    setShowAdminPassword(false);
    setUserPassword("");
    setUserPasswordError(null);
  };

  const handleAdminClick = () => {
    setSelectedUser("Admin");
    setError(null);
    setShowAdminPassword(true);
    setAdminPassword("");
    setAdminError(null);
  };

  const handleAdminLogin = async () => {
    setAdminLoading(true);
    setAdminError(null);

    if (!isSupabaseConfigured || !supabase) {
      setAdminError("Supabase is not configured");
      setAdminLoading(false);
      return;
    }

    const { data } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "admin_password")
      .single();

    if (!data || adminPassword !== data.setting_value) {
      setAdminError("Incorrect password");
      setAdminLoading(false);
      return;
    }

    try {
      await startSession("Admin");
      localStorage.setItem("foodatm_admin_auth", "true");
      navigate("/admin");
    } catch (err: any) {
      setAdminError(err.message || "Failed to start admin session");
      setAdminLoading(false);
    }
  };

  return (
    <div className="shift-picker-screen">
      <div className="shift-picker-content">
        <div className="brand-icon-wrapper" title="FoodATM Warehouse">
          <img src="/logo2.png" alt="FoodATM Logo" className="brand-logo" />
        </div>

        <br />

        <p className="shift-picker-subtitle">Select your name to begin</p>

        <div className="session-user-grid">
          {usersLoading ? (
            <div className="spinner" style={{ margin: "1rem auto" }} />
          ) : (
            users.map((user) => (
              <button
                key={user}
                className={`session-user-btn ${selectedUser === user ? "selected" : ""}`}
                onClick={() => handleSelectUser(user)}
                type="button"
              >
                <span className="session-user-avatar">
                  {user.charAt(0).toUpperCase()}
                </span>
                <span className="session-user-name">{user}</span>
              </button>
            ))
          )}

          <button
            className={`session-user-btn session-user-btn-admin ${selectedUser === "Admin" ? "selected" : ""}`}
            onClick={handleAdminClick}
            type="button"
          >
            <span className="session-user-avatar admin-avatar">
              <Shield size={22} />
            </span>
            <span className="session-user-name">Admin</span>
          </button>
        </div>

        {selectedUser && selectedUser !== "Admin" && (
          <div className="admin-password-form">
            <p className="admin-password-label">Enter password for {selectedUser}</p>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="form-input"
                placeholder="Password"
                value={userPassword}
                onChange={(e) => {
                  setUserPassword(e.target.value);
                  setUserPasswordError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUserLogin();
                }}
                autoFocus
              />
            </div>
            {userPasswordError && (
              <div
                className="form-error"
                style={{
                  marginTop: "0.5rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                {userPasswordError}
              </div>
            )}
            <button
              className="btn btn-primary session-start-btn"
              onClick={handleUserLogin}
              disabled={userPasswordLoading || starting}
              type="button"
              style={{ marginTop: "0.75rem" }}
            >
              <LogIn size={18} />
              <span>{userPasswordLoading ? "Verifying..." : starting ? "Starting..." : "Login"}</span>
            </button>
          </div>
        )}

        {showAdminPassword && (
          <div className="admin-password-form">
            <p className="admin-password-label">Enter admin password</p>
            <input
              type="password"
              className="form-input"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setAdminError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdminLogin();
              }}
              autoFocus
            />
            {adminError && (
              <div
                className="form-error"
                style={{
                  marginTop: "0.5rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                {adminError}
              </div>
            )}
            <button
              className="btn btn-primary session-start-btn"
              onClick={handleAdminLogin}
              disabled={adminLoading}
              type="button"
              style={{ marginTop: "0.75rem" }}
            >
              <Shield size={18} />
              <span>{adminLoading ? "Verifying..." : "Login as Admin"}</span>
            </button>
          </div>
        )}

        {error && (
          <div
            className="form-error"
            style={{
              marginTop: "1rem",
              background: "rgba(239, 68, 68, 0.1)",
              padding: "0.65rem 0.85rem",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
