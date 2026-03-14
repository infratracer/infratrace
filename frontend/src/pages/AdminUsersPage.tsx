import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser } from "../api/admin";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Spinner from "../components/ui/Spinner";
import { formatDate } from "../utils/format";
import { UserPlus, X, Users } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import type { User } from "../types";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "project_manager", label: "Project Manager" },
  { value: "auditor", label: "Auditor" },
  { value: "stakeholder", label: "Stakeholder" },
];

export default function AdminUsersPage() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} className="text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
          {users.length} user{users.length !== 1 ? "s" : ""}
        </span>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={14} /> : <UserPlus size={14} />}
          {showForm ? "Cancel" : "Add User"}
        </Button>
      </div>

      {showForm && (
        <GlassCard padding="md">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              <Select label="Role" options={ROLE_OPTIONS} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
              <Input label="Organisation" value={form.organisation} onChange={(e) => setForm((f) => ({ ...f, organisation: e.target.value }))} />
            </div>
            <Button onClick={handleCreate}>Create User</Button>
          </div>
        </GlassCard>
      )}

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users" />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <GlassCard key={u.id} padding="sm">
              <div className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--color-glass-border)" }}
                >
                  {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {u.full_name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {u.email}
                  </p>
                </div>
                <Badge variant={u.is_active ? "risk-low" : "risk-high"}>
                  {u.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="default">{u.role.replace("_", " ")}</Badge>
                <span className="text-[10px] hidden md:block" style={{ color: "var(--text-muted)" }}>
                  {formatDate(u.created_at)}
                </span>
                <Button size="sm" variant="ghost" onClick={() => handleToggleActive(u)}>
                  {u.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
