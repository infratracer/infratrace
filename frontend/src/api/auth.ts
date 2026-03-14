import client from "./client";

export async function login(email: string, password: string) {
  const res = await client.post("/auth/login", { email, password });
  return res.data;
}

export async function refreshToken() {
  const res = await client.post("/auth/refresh");
  return res.data;
}

export async function logout() {
  await client.post("/auth/logout");
}

export async function getMe() {
  const res = await client.get("/auth/me");
  return res.data;
}
