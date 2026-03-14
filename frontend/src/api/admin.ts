import client from "./client";
import type { User, AuditLogEntry } from "../types";

export async function getUsers(): Promise<User[]> {
  const res = await client.get("/admin/users");
  return res.data;
}

export async function createUser(data: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  organisation?: string;
}): Promise<User> {
  const res = await client.post("/admin/users", data);
  return res.data;
}

export async function updateUser(
  userId: string,
  data: Partial<{ full_name: string; role: string; organisation: string; is_active: boolean }>
): Promise<User> {
  const res = await client.put(`/admin/users/${userId}`, data);
  return res.data;
}

export async function getAuditLog(params?: {
  user_id?: string;
  action?: string;
  page?: number;
  per_page?: number;
}): Promise<AuditLogEntry[]> {
  const res = await client.get("/admin/audit-log", { params });
  return res.data;
}
