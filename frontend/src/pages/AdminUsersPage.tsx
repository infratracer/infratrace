import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser } from "../api/admin";
import { useTheme } from "../hooks/useTheme";
import { formatDate } from "../utils/format";
import type { User } from "../types";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "auditor", label: "Auditor" },
  { value: "stakeholder", label: "Stakeholder" },
];

export default function AdminUsersPage() {
  const t = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "project_manager", organisation: "" });

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    try {
      await createUser(form);
      setShowForm(false);
      setForm({ email: "", password: "", full_name: "", role: "project_manager", organisation: "" });
      loadUsers();
    } catch (err) {
      console.error("Failed to create user:", err);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      loadUsers();
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const glassCard: React.CSSProperties = {
    background: t.bgCard,
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 18,
    boxShadow: `${t.glassShadow}, ${t.glassInnerGlow}`,
    padding: "20px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: t.bgInput,
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 10,
    color: t.textPrimary,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none" as const,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: t.accent,
    border: "none",
    borderRadius: 10,
    color: "#FFF",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: t.btnShadow,
  };

  const buttonSmStyle: React.CSSProperties = {
    padding: "6px 14px",
    background: t.accent,
    border: "none",
    borderRadius: 10,
    color: "#FFF",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const ghostButtonStyle: React.CSSProperties = {
    padding: "6px 14px",
    background: "transparent",
    border: `1px solid ${t.glassBorder}`,
    borderRadius: 10,
    color: t.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const overline: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: t.textMuted,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${t.glassBorder}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: t.textSecondary }}>
          {users.length} user{users.length !== 1 ? "s" : ""}
        </span>
        <button style={buttonSmStyle} onClick={() => setShowForm(!showForm)}>
          {showForm ? "\u2715 Cancel" : "\u002B Add User"}
        </button>
      </div>

      {showForm && (
        <div style={{ ...glassCard, padding: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={overline}>Full Name</label>
                <input
                  style={inputStyle}
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              </div>
              <div>
                <label style={overline}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={overline}>Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <label style={overline}>Role</label>
                <select
                  style={selectStyle}
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={overline}>Organisation</label>
                <input
                  style={inputStyle}
                  value={form.organisation}
                  onChange={(e) => setForm((f) => ({ ...f, organisation: e.target.value }))}
                />
              </div>
            </div>
            <button style={buttonStyle} onClick={handleCreate}>Create User</button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, color: t.textMuted }}>
          <span style={{ fontSize: 32, marginBottom: 8 }}>{"\u{1F465}"}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>No users</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((u) => (
            <div key={u.id} style={{ ...glassCard, padding: "10px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                    backgroundColor: t.bgCard,
                    color: t.textPrimary,
                    border: `1px solid ${t.glassBorder}`,
                  }}
                >
                  {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.full_name}
                  </p>
                  <p style={{ fontSize: 11, color: t.textMuted, margin: 0 }}>
                    {u.email}
                  </p>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    background: u.is_active ? t.neonGreenDim : t.neonRedDim,
                    color: u.is_active ? t.neonGreen : t.neonRed,
                  }}
                >
                  {u.is_active ? "Active" : "Inactive"}
                </span>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    background: t.bgElevated,
                    color: t.textSecondary,
                  }}
                >
                  {u.role.replace("_", " ")}
                </span>
                <span style={{ fontSize: 10, color: t.textMuted }}>
                  {formatDate(u.created_at)}
                </span>
                <button style={ghostButtonStyle} onClick={() => handleToggleActive(u)}>
                  {u.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
