import axios from "axios";
import { env } from "../config/env";

const publicClient = axios.create({
  baseURL: `${env.API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

export async function getPublicTimeline(projectId: string) {
  const res = await publicClient.get(`/public/projects/${projectId}/timeline`);
  return res.data;
}

export async function verifyPublicChain(projectId: string) {
  const res = await publicClient.post(`/public/projects/${projectId}/verify/chain`);
  return res.data;
}

export async function verifyPublicHash(recordHash: string) {
  const res = await publicClient.get(`/public/verify/${recordHash}`);
  return res.data;
}
