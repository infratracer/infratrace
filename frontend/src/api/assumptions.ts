import client from "./client";
import type { Assumption } from "../types";

export async function getAssumptions(projectId: string): Promise<Assumption[]> {
  const res = await client.get(`/projects/${projectId}/assumptions`);
  return res.data;
}

export async function createAssumption(
  projectId: string,
  data: {
    category: string;
    description: string;
    sensor_type?: string;
    threshold_value?: number;
    threshold_unit?: string;
  }
): Promise<Assumption> {
  const res = await client.post(`/projects/${projectId}/assumptions`, data);
  return res.data;
}

export async function updateAssumption(
  projectId: string,
  assumptionId: string,
  data: Partial<{
    status: string;
    threshold_value: number;
    linked_decision_id: string;
  }>
): Promise<Assumption> {
  const res = await client.put(`/projects/${projectId}/assumptions/${assumptionId}`, data);
  return res.data;
}
