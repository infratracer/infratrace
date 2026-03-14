import client from "./client";
import type { Decision } from "../types";

export async function getDecisions(
  projectId: string,
  params?: { decision_type?: string; page?: number; per_page?: number }
): Promise<Decision[]> {
  const res = await client.get(`/projects/${projectId}/decisions`, { params });
  return res.data;
}

export async function getDecision(projectId: string, decisionId: string): Promise<Decision> {
  const res = await client.get(`/projects/${projectId}/decisions/${decisionId}`);
  return res.data;
}

export async function createDecision(
  projectId: string,
  data: {
    decision_type: string;
    title: string;
    description: string;
    justification: string;
    cost_impact?: number;
    risk_level?: string;
    approved_by: string;
    sensor_trigger_id?: string;
  }
): Promise<Decision> {
  const res = await client.post(`/projects/${projectId}/decisions`, data);
  return res.data;
}

export async function getTimeline(projectId: string) {
  const res = await client.get(`/projects/${projectId}/decisions/timeline`);
  return res.data;
}
